import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Calendar as CalIcon, Clock, LogIn, LogOut, Save, Sword, Coffee, Plus, Trash2, Users, ChevronLeft, ChevronRight, Info, Flag, User, Loader2 } from 'lucide-react';

const BOSS_LIST = ['普通拉圖斯', '困難拉圖斯', '殘暴炎魔', '暗黑龍王'];
const JOBS = ['英雄', '黑騎士', '聖騎士', '主教', '火毒大魔導', '冰雷大魔導', '箭神', '神射手', '夜使者', '暗影神偷', '拳霸', '槍神'];
const DEFAULT_TIMES = ['09:30', '10:00', '10:30', '19:00', '19:30', '21:00', '22:00', '22:30', '23:00'];

function App() {
  const [session, setSession] = useState(null)
  const [viewMode, setViewMode] = useState('personal')
  const [selectedSlots, setSelectedSlots] = useState([])
  const [activeTimes, setActiveTimes] = useState(['10:30', '20:00', '21:00', '22:00'])
  const [customTime, setCustomTime] = useState('')
  const [roleInfo, setRoleInfo] = useState({ displayName: '', level: '', job: '', bosses: [],contactInfo: ''})
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' });
  const [leaderSlots, setLeaderSlots] = useState([]);


  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500); // 2.5秒後自動消失
  };
  
  const getMon = (d) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(date.setDate(diff));
  }
  const [baseDate, setBaseDate] = useState(getMon(new Date()))
  const weekDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return {
      dayName: ['一', '二', '三', '四', '五', '六', '日'][i],
      dateNum: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
      isWeekend: i === 5 || i === 6
    };
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadData(session?.user?.id, weekDateStr);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') {
        showToast("⚔️ 歡迎回來，冒險者！");
      }
    });
    return () => subscription.unsubscribe();
  }, [weekDateStr]);

  // ---------------------------------------------------------
  // 🚀 新增：Discord 戰報發送功能
  // ---------------------------------------------------------
  const sendToDiscord = async (userName, selectedSlots, weekDateStr, bossName) => {
    // ⚠️ 請填入你的 Webhook URL
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1493654863312195784/YE09_033lvIkcTVYywv-TukS-Ef1Osd2VD11lIxPgqm3d-2PYzQLyvf4G3rAVCUs2GR0'; 

    // --- 📝 計算「本週」或「下週」標籤 ---
    const getWeekLabel = (dateStr) => {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0); // 強制重置時間以便精確比對
      
      const now = new Date();
      const day = today.getDay() || 7; 
      const currentMonday = new Date(now);
      currentMonday.setDate(now.getDate() - day + 1); // 找出本週週一
      currentMonday.setHours(0, 0, 0, 0);

      const diffDays = Math.round((targetDate.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "【本週戰報】";
      if (diffDays === 7) return "【下週戰報】";
      return `【${dateStr} 戰報】`;
    };

    const weekLabel = getWeekLabel(weekDateStr);

    // --- 📝 2. 排版邏輯優化：增加分隔線與分組 ---
    let slotDisplay = "尚未選擇時段";
    if (selectedSlots.length > 0) {
      // 依日期排序
      const sortedSlots = [...selectedSlots].sort();

      let lastDate = "";
      const formattedList = sortedSlots.map(slot => {
        const [dayName, time] = slot.split('-');
        const daysMap = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6 };
        const baseDate = new Date(weekDateStr);
        baseDate.setDate(baseDate.getDate() + daysMap[dayName]);
        const dateDisplay = `${baseDate.getMonth() + 1}/${baseDate.getDate()}`;

        let separator = "";
        if (lastDate !== "" && lastDate !== dateDisplay) {
          separator = "━━━━━━━━━━━━━━\n"; // 橫跨手機版面的長線
        }
        lastDate = dateDisplay;

        return `${separator}● **${dateDisplay} (${dayName})** 🕙 ${time}`;
      });
      slotDisplay = formattedList.join('\n');
    }


    const content = {
      embeds: [{
        title: `⚔️ Artale Raid Hub | ${weekLabel}`,
        description: `成員 **${userName}** 剛剛更新了可參加時段！`,
        color: 0xD35400, 
        fields: [
          {
            name: "🎯 預定目標 (BOSS)",
            value: `**${bossName || "未指定 BOSS"}**`, // 顯示 BOSS
            inline: true
          },
          {
            name: "📅 已選擇時段",
            value: slotDisplay,
            inline: false
          }
        ],
        footer: { text: "版本號：v1.2.0 Build 20260415" },
        timestamp: new Date()
      }]
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      console.log("✅ Discord 發送指令已執行");
    } catch (error) {
      console.error('❌ Discord 發送失敗:', error);
    }
  };

  const loadData = async (uid, date) => {
    const { data: team } = await supabase.from('schedules').select('*').eq('week_date', date);
    setAllData(team || []);
    if (uid) {
      const { data: me } = await supabase.from('schedules').select('*').eq('user_id', uid).eq('week_date', date).maybeSingle();
      if (me) {
        setSelectedSlots(me.slots || []);
        if (me.active_times) setActiveTimes(me.active_times);
        setLeaderSlots(me.is_leader_slots || []);
        setRoleInfo({ 
          displayName: me.user_name || '',
          level: me.level || '', 
          job: me.job || '', 
          bosses: me.bosses || [],
          contactInfo: me.contact_info || '' 
        });
      }
    }
  }

  const toggleSlot = (sid) => {
    if (viewMode !== 'personal') return;
    setSelectedSlots(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]);
  }
  const getLeader = (members, slotId) => {
   if (!members || members.length === 0) return null;
   // 1. 優先找手動認領帶隊的人
   const manualLeader = members.find(m => m.is_leader_slots?.includes(slotId));
   if (manualLeader) return manualLeader;
   // 2. 自動推舉等級最高者
   return [...members].sort((a, b) => (parseInt(b.level) || 0) - (parseInt(a.level) || 0))[0];
  };


  const handleSave = async () => {
    if (!session) return alert("請先登入 Discord 帳號！");
    if (!roleInfo.displayName.trim()) return alert("請填寫顯示名稱！");
    if (!roleInfo.job) return alert("請選擇你的職業！");

    setLoading(true);
    const { error } = await supabase.from('schedules').upsert({
      user_id: session.user.id,
      user_name: roleInfo.displayName,
      week_date: weekDateStr,
      slots: selectedSlots,
      active_times: activeTimes,
      level: roleInfo.level,
      job: roleInfo.job,
      bosses: roleInfo.bosses,
      contact_info: roleInfo.contactInfo,
      is_leader_slots: leaderSlots,
      updated_at: new Date().toISOString()
    }, { onConflict: ['user_id', 'week_date'] });
    
    setTimeout(() => {
      setLoading(false);
      if (!error) {
        sendToDiscord(roleInfo.displayName || "未知成員", selectedSlots, weekDateStr, viewMode);

        showToast('🔥 數據同步成功！已推送到 Discord');
        loadData(session.user.id, weekDateStr);
      } else {
        showToast('儲存失敗：' + error.message);
      }
    }, 400);
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'discord' });
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // 👇 新增：登出成功提示
    showToast("☕ 辛苦了！期待下次見面");
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3728] font-sans pb-10 text-left">
      <header className="bg-white border-b border-[#EADBC8] px-8 py-3 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#8B4513] p-2 rounded-xl text-white shadow-md"><Sword size={20}/></div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[#5D4037]">ARTALE <span className="text-[#D35400]">RAID HUB</span></h1>
              <p className="text-[9px] text-[#A67C52] font-bold uppercase tracking-widest">Elite Squad Coordinator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="flex items-center gap-3 bg-[#F5EFE6] pl-3 pr-1 py-1 rounded-full border border-[#EADBC8]">
                  <span className="text-[11px] font-black text-[#5D4037]">{roleInfo.displayName || '載入中...'}</span>
                {session?.user?.user_metadata?.avatar_url ? (
                  <img 
                  src={session?.user?.user_metadata?.avatar_url} 
                  className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover"
                  alt="avatar"
                  referrerPolicy="no-referrer" 
                  // 👇 💡 新增onError 診斷邏輯
                  onError={(e) => {
                    // 💡 關鍵：先移除 onError 避免無限循環
                    e.target.onerror = null; 
      
                    // 💡 靜默替換為預設圖示，不再呼叫 showToast
                    const fallbackName = encodeURIComponent(roleInfo.displayName || 'User');
                    e.target.src = `https://ui-avatars.com/api/?name=${fallbackName}&background=D35400&color=fff&rounded=true`;
      
                    // 在後台印出診斷訊息就好，不要吵使用者
                    console.warn("Avatar load failed, switched to fallback.");
                  }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EADBC8] flex items-center justify-center">
                    <User size={16} className="text-[#5D4037]" />
                  </div>
                )}
                </div>
                <button onClick={handleLogout} className="p-2 text-[#A67C52] hover:text-[#D35400] transition-colors" title="登出">
                  <LogOut size={18}/>
                </button>
              </>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-[#5865F2] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md hover:bg-[#4752C4] transition-all active:scale-95">
                <LogIn size={16}/> Login with Discord
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto mt-6 px-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 左側面板 */}
          <div className="lg:col-span-3 space-y-5">
            <section className="bg-white p-5 rounded-[24px] border border-[#EADBC8] shadow-sm">
              <h3 className="text-xs font-black text-[#5D4037] mb-4 flex items-center gap-2">
                <Info size={16} className="text-[#D35400]"/> 快速上手指南
              </h3>
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <span className="text-[#D35400] font-black text-[10px] mt-0.5">01</span>
                  <p className="text-[10px] leading-relaxed text-[#8B735B]">
                    登入後請於下方填寫 <span className="font-bold">顯示名稱</span> 與 <span className="font-bold text-[#5D4037]">等級</span>。
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#D35400] font-black text-[10px] mt-0.5">02</span>
                  <p className="text-[10px] leading-relaxed text-[#8B735B]">
                    在右側表格點擊時段，選中會標註為 <span className="text-[#D35400] font-black">橘色方格</span>。
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#D35400] font-black text-[10px] mt-0.5">03</span>
                  <p className="text-[10px] leading-relaxed text-[#8B735B]">
                    點擊 <span className="text-[#5D4037] font-black italic">Sync Data</span> 同步至雲端。
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-5 rounded-[24px] border border-[#EADBC8] shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-[#A67C52] uppercase tracking-widest flex items-center gap-2"><User size={14}/> ADVENTURER INFO</h3>
              <div className="space-y-3">
                <input type="text" placeholder="顯示名稱 / ID" value={roleInfo.displayName} onChange={(e)=>setRoleInfo({...roleInfo, displayName:e.target.value})} className="w-full bg-[#FDFBF7] border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#D35400] transition-colors" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Lv (等級)" value={roleInfo.level} onChange={(e)=>setRoleInfo({...roleInfo, level:e.target.value})} className="bg-[#FDFBF7] border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#D35400] transition-colors" />
                  <select value={roleInfo.job} onChange={(e)=>setRoleInfo({...roleInfo, job:e.target.value})} className="bg-[#FDFBF7] border border-[#EADBC8] rounded-xl px-2 py-2 text-xs font-bold outline-none">
                    <option value="" disabled>請選擇職業</option>
                    {JOBS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Discord ID"
                  value={roleInfo.contactInfo}
                  onChange={(e)=>setRoleInfo({...roleInfo, contactInfo:e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#EADBC8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#D35400] transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F5EFE6]">
                {BOSS_LIST.map(b => (
                  <button key={b} onClick={()=>{
                    const n = roleInfo.bosses.includes(b) ? roleInfo.bosses.filter(x=>x!==b) : [...roleInfo.bosses, b];
                    setRoleInfo({...roleInfo, bosses:n});
                  }} className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all active:scale-95 ${roleInfo.bosses.includes(b)?'bg-[#D35400] text-white border-[#D35400] shadow-sm':'bg-[#FDFBF7] text-[#A67C52] border-[#EADBC8]'}`}>{b}</button>
                ))}
              </div>
            </section>

            <section className="bg-white p-5 rounded-[24px] border border-[#EADBC8] shadow-sm">
              <h3 className="text-[10px] font-black text-[#A67C52] mb-3 uppercase tracking-widest flex items-center gap-2"><CalIcon size={14}/> SCHEDULE WEEK</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  setBaseDate(new Date(baseDate.setDate(baseDate.getDate() - 7)));
                  setSelectedSlots([]);
                }} className="p-2 hover:bg-[#F5EFE6] rounded-lg transition-colors text-[#A67C52] hover:text-[#D35400]">
                  <ChevronLeft size={18}/>
                </button>

                <div className="flex-1 text-center font-bold text-xs bg-[#FDFBF7] py-1.5 rounded-lg border border-[#EADBC8]">
                  {weekDateStr}
                </div>

                <button onClick={() => {
                  setBaseDate(new Date(baseDate.setDate(baseDate.getDate() + 7)));
                  setSelectedSlots([]);
                }} className="p-2 hover:bg-[#F5EFE6] rounded-lg transition-colors text-[#A67C52] hover:text-[#D35400]">
                  <ChevronRight size={18}/>
                </button>
              </div>
            </section>

            <section className="bg-white p-5 rounded-[24px] border border-[#EADBC8] shadow-sm">
              <h3 className="text-[10px] font-black text-[#A67C52] mb-3 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> QUICK ACCESS</h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {DEFAULT_TIMES.map(t => (
                  <button key={t} onClick={()=>{ if(!activeTimes.includes(t)) setActiveTimes([...activeTimes, t].sort()) }} className="px-1.5 py-1 bg-[#F5EFE6] text-[#A67C52] rounded-md text-[9px] font-bold hover:bg-[#D35400] hover:text-white active:scale-95 transition-all">+{t}</button>
                ))}
              </div>
              <div className="flex gap-1 mb-4">
                <input type="text" placeholder="00:00" value={customTime} onChange={(e)=>setCustomTime(e.target.value)} className="flex-1 bg-[#FDFBF7] border border-[#EADBC8] rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none" />
                <button onClick={()=>{ if(customTime && !activeTimes.includes(customTime)){setActiveTimes([...activeTimes, customTime].sort()); setCustomTime('')} }} className="bg-[#8B4513] text-white p-1.5 rounded-lg active:scale-90 transition-transform"><Plus size={14}/></button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#F5EFE6]">
                {activeTimes.map(t => (
                  <div key={t} className="bg-[#FDFBF7] px-2 py-1 rounded-md text-[9px] font-black text-[#D35400] border border-[#EADBC8] flex items-center gap-1 group">
                    {t} <button onClick={()=>setActiveTimes(activeTimes.filter(x=>x!==t))} className="text-[#A67C52] hover:text-red-500 transition-all"><Trash2 size={10}/></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 右側表格 */}
          <div className="lg:col-span-9 bg-white p-6 rounded-[32px] border border-[#EADBC8] shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex bg-[#F5EFE6] p-1 rounded-xl border border-[#EADBC8] w-full md:w-auto">
                <button onClick={()=>setViewMode('personal')} className={`flex-1 md:flex-none px-8 py-2 rounded-lg text-xs font-black transition-all ${viewMode==='personal'?'bg-[#D35400] text-white shadow-md':'text-[#A67C52]'}`}>個人排班</button>
                <button onClick={()=>setViewMode('team')} className={`flex-1 md:flex-none px-8 py-2 rounded-lg text-xs font-black transition-all ${viewMode==='team'?'bg-[#5D4037] text-white shadow-md':'text-[#A67C52]'}`}>團隊統整</button>
              </div>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className={`w-full md:w-auto px-10 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 transform ${loading ? 'bg-[#A67C52] opacity-80' : 'bg-[#D35400] hover:bg-[#A04000] text-white'}`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
                {loading ? 'SAVING...' : 'SYNC DATA'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#EADBC8]/30">
              <div className="min-w-[800px] grid grid-cols-8 gap-2 p-2">
                <div className="h-10"></div>
                {weekDates.map(d => (
                  <div key={d.dayName} className={`text-center p-2 rounded-xl border ${d.isWeekend ? 'bg-[#FFF5F0] border-[#FFD8C4]' : 'bg-[#FDFBF7] border-[#EADBC8]'}`}>
                    <div className={`text-[9px] font-black uppercase tracking-widest ${d.isWeekend ? 'text-[#D35400]' : 'text-[#A67C52]'}`}>週{d.dayName}</div>
                    <div className={`text-xs font-black mt-0.5 ${d.isWeekend ? 'text-[#D35400]' : 'text-[#5D4037]'}`}>{d.dateNum}</div>
                  </div>
                ))}
                {activeTimes.map(time => (
                  <React.Fragment key={time}>
                    <div className="flex items-center justify-end pr-3 text-[10px] font-black text-[#A67C52] italic">{time}</div>
                    {weekDates.map(d => {
                      const sid = `${d.dayName}-${time}`;
                      const players = allData.filter(p => p.slots?.includes(sid));
                      const isSelected = selectedSlots.includes(sid);
                      return (
                        <div key={sid} onClick={() => toggleSlot(sid)} className={`min-h-[110px] p-2 rounded-[20px] border-2 transition-all active:scale-[0.98] ${viewMode === 'personal' ? (isSelected ? "bg-[#D35400] border-[#A04000] shadow-inner" : "bg-[#FDFBF7] border-[#EADBC8]/40 cursor-pointer") : (players.length > 0 ? "bg-white border-[#EADBC8]" : "bg-transparent border-dashed border-[#EADBC8]/20")}`}>
                          {viewMode === 'team' && players.map((p, i) => {
                              const isLeader = getLeader(players, sid)?.user_id === p.user_id;
  
                              return (
                            <div 
                              key={i} 
                              className={`mb-1 p-1.5 rounded-lg text-[8px] font-bold border-l-2 shadow-sm relative transition-all ${
                                isLeader
                                  ? 'bg-[#FFF5F0] border-[#D35400]' // 隊長：淡橘底、橘邊
                                  : 'bg-[#FDFBF7] border-[#EADBC8]'  // 成員：米白底、淺棕邊
                              }`}
                            >  
                              {/* 保留原本的名字與等級顯示 */}
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="truncate flex items-center gap-1 text-[#5D4037]">
                                  {isLeader && '👑'} {p.user_name}
                                </span>
                                <span className="text-[#D35400] shrink-0">Lv.{p.level}</span>
                              </div>

                              {/* 保留原本的職業與 Boss 標籤 */}
                              <div className="flex flex-col gap-0.5">
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[#A67C52]">{p.job}</span>
                                  {p.bosses?.map(b => (
                                    <span key={b} className="bg-[#F5EFE6] px-1 rounded-[2px] scale-90 origin-left text-[7px]">#{b}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'team' && (
          <section className="bg-white p-6 rounded-[32px] border border-[#EADBC8] shadow-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="bg-[#D35400] p-2 rounded-xl text-white shadow-md"><Flag size={18}/></div>
              <h2 className="text-lg font-black text-[#5D4037] tracking-tight">每週成團戰報</h2>
            </div>

            {/* 優化：改用 flex 垂直排列，並按日期分組感 */}
            <div className="space-y-8">
              {/* 步驟 1: 處理資料排序 */}
              {(() => {
                const sortedSlots = activeTimes
                 .flatMap(t => weekDates.map(d => ({
                   sid: `${d.dayName}-${t}`,
                   day: d.dayName,
                   date: d.dateNum,
                   time: t,
                   // 建立排序權重：日期優先於時間
                   weight: `${weekDates.findIndex(wd => wd.dayName === d.dayName)}-${t}`
                 })))
                 .filter(slot => allData.some(p => p.slots?.includes(slot.sid)))
                 .sort((a, b) => a.weight.localeCompare(b.weight));

                if (sortedSlots.length === 0) return <p className="text-center text-[#A67C52] py-10 font-bold">目前尚無成團資訊</p>;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedSlots.map((slot, index) => {
                      const members = allData.filter(p => p.slots?.includes(slot.sid));

                      // 檢查是否為當天的第一個團，用來顯示分組感
                      const isFirstOfDate = index === 0 || sortedSlots[index - 1].day !== slot.day;

                      return (
                        <div key={slot.sid} className={`flex flex-col ${isFirstOfDate ? 'md:mt-0' : ''}`}>
                          {/* 只有當天第一個團顯示大標題，增加呼吸感 */}
                          {isFirstOfDate && (
                            <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
                              <span className="bg-[#5D4037] text-white text-[10px] px-2 py-1 rounded-lg font-black">
                                週{slot.day} {slot.date}
                              </span>
                              <div className="h-[1px] flex-1 bg-[#EADBC8]"></div>
                            </div>
                          )}

                          {/* 卡片本體 */}
                          <div className="bg-[#FDFBF7] border border-[#EADBC8] rounded-[24px] p-4 shadow-sm">
                            <div className="text-[11px] font-black text-[#D35400] mb-3 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-[#D35400] rounded-full"></span>
                              {slot.time} 突擊小隊
                            </div>
                            {/* 這裡放原本的 members.map 內容 */}
                            <div className="space-y-1.5">
                              {members.map((m, mi) => {
                                const isLeader = getLeader(members, slot.sid)?.user_id === m.user_id;
                                const isMe = session?.user?.id === m.user_id;

                                return (
                                  <div 
                                    key={mi} 
                                    className={`text-[10px] p-2 rounded-lg border shadow-sm transition-all ${
                                      isLeader 
                                        ? 'bg-[#FFF5F0] border-[#D35400] ring-1 ring-[#D35400]/20' 
                                        : 'bg-white border-[#EADBC8]'
                                    }`}
                                  >
                                    <div className="flex justify-between font-bold text-[#5D4037] mb-1">
                                      <span className="flex items-center gap-1">
                                        {isLeader && <span title="隊長">👑</span>}
                                        {m.user_name} 
                                        <span className="text-[#D35400] text-[8px] ml-1">Lv.{m.level}</span>
                                      </span>
                                      <span className="text-[#A67C52] font-medium">{m.job}</span>
                                    </div>
            
                                    {m.contact_info && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(m.contact_info);
                                          showToast(`已複製 ${m.user_name} 的 Discord ID！`);
                                        }}
                                        className="text-[#5D4037] opacity-30 hover:opacity-100 hover:text-[#5865F2] transition-all p-0.5"
                                        title={`複製 Discord: ${m.contact_info}`}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                        </svg>
                                      </button>
                                    )}
            
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {m.bosses?.map(b => (
                                        <span 
                                          key={b} 
                                          className="text-[7px] bg-[#FFF5F0] text-[#D35400] px-1.5 py-0.5 rounded border border-[#FFD8C4]"
                                        >
                                          {b}
                                        </span>
                                      ))}
                                    </div>

                                    {isMe && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const isLeading = leaderSlots.includes(slot.sid);
                                          setLeaderSlots(isLeading 
                                            ? leaderSlots.filter(s => s !== slot.sid) 
                                            : [...leaderSlots, slot.sid]
                                          );
                                          showToast(isLeading ? "已卸下隊長職責" : "⚔️ 你已接手此團隊長！");
                                        }}
                                        className={`w-full py-1 rounded-md text-[8px] font-black transition-all border ${
                                          leaderSlots.includes(slot.sid) 
                                            ? 'bg-[#D35400] text-white border-[#D35400]' 
                                            : 'bg-white text-[#A67C52] border-[#EADBC8] hover:border-[#D35400] hover:text-[#D35400]'
                                        }`}
                                      >
                                        {leaderSlots.includes(slot.sid) ? '取消帶隊' : '🙋 我來帶隊'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-[1400px] mx-auto mt-16 px-4 pb-16">
        <div className="bg-white/60 backdrop-blur-md border border-[#EADBC8] rounded-[32px] p-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-[#F5EFE6] p-4 rounded-2xl border border-[#EADBC8] shadow-sm">
               <Coffee size={28} className="text-[#8B4513]" />
              </div>
            </div>
            <div>
              <div className="flex flex-col justify-center">
               <p className="text-[10px] font-black text-[#A67C52] uppercase tracking-[0.2em] mb-1">Developed By</p>
               <h4 className="text-2xl font-black text-[#5D4037] leading-none">Vincent</h4>
              </div>
            </div>
          
            <div className="flex-1 text-center md:text-left md:px-10">
              <h5 className="text-[14px] font-bold text-[#5D4037] mb-1">
                專為 Artale BOSS 突擊打造的排班工具
              </h5>
              <p className="text-[12px] text-[#8B735B] font-medium">
                祝各位遠征隊成員打寶順利、楓幣滾滾來！ 🍁
              </p>
            </div> 
            
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#5865F2] rounded-2xl text-white shadow-md transition-transform hover:scale-105">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
               </svg>
               <span className="text-[12px] font-bold">24_vincent</span>
              </div>
               <a 
                 href="https://www.instagram.com/24.vincent"
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#EADBC8] rounded-2xl text-[#8B735B] hover:text-[#D35400] hover:border-[#D35400] transition-all shadow-sm group"
               >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                 <span className="text-[12px] font-bold">Follow Me</span>
               </a>
            
               <span className="text-[10px] font-bold bg-[#8B4513]/10 text-[#8B4513] px-4 py-2.5 rounded-2xl border border-[#8B4513]/10">
                 v1.2.0 Build 20260415
               </span>
              </div>
            </div>
               
          <div className="mt-10 pt-6 border-t border-[#F5EFE6] text-[10px] font-medium text-[#A67C52]/50 text-center tracking-widest">
            &copy; {new Date().getFullYear()} Artale Raid Hub. All rights reserved.
          </div>
        </div>
          
        {toast.show && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
            <div className="bg-[#5D4037] text-[#FDFBF7] px-5 py-3 rounded-xl shadow-2xl border-2 border-[#D35400] flex items-center gap-3 backdrop-blur-md">
              <div className="bg-[#D35400] p-1.5 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-xs font-black tracking-widest">{toast.message}</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;