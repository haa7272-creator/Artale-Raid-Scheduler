// src/utils/discordWebhook.js

// 🌟 1. 填入【個人戰報 (排班更新)】頻道的正式 Webhook (記得換回測試用網址如果你正在測試)
const WEBHOOK_UPDATE = 'https://discord.com/api/webhooks/1493654863312195784/YE09_033lvIkcTVYywv-TukS-Ef1Osd2VD11lIxPgqm3d-2PYzQLyvf4G3rAVCUs2GR0';

// 🌟 2. 填入【出團通知 (滿團廣播)】頻道的正式 Webhook
const WEBHOOK_ALERT = 'https://discord.com/api/webhooks/1494038268344406116/bOpqn8DlcFEpTu_rYr7BypBvsKUmfrj7VaG66OqamUNs11-wB5EKoqnuCeOsiR-irFtH';

const BOT_NAME = "遠征隊秘書";


// ---------------------------------------------------------
// 1. 個人更新班表的通知
// ---------------------------------------------------------
export const sendPersonalUpdate = async (userName, selectedSlots, weekDateStr, bossName, discordId, contactInfo) => {
    const hasBoss = bossName && bossName !== 'personal' && bossName !== '';

    // 🌟 TAG 判斷邏輯
    let userTag = `**${userName}**`;
    if (discordId) {
        userTag = `<@${discordId}>`;
    } else if (contactInfo && /^\d{17,19}$/.test(contactInfo)) {
        userTag = `<@${contactInfo}>`;
    }

    const getWeekLabel = (dateStr) => {
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const now = new Date();
        const day = now.getDay() || 7;
        const currentMonday = new Date(now);
        currentMonday.setDate(now.getDate() - day + 1);
        currentMonday.setHours(0, 0, 0, 0);
        const diffDays = Math.round((targetDate.getTime() - currentMonday.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "【本週戰報】";
        if (diffDays === 7) return "【下週戰報】";
        return `【${dateStr} 戰報】`;
    };

    const weekLabel = getWeekLabel(weekDateStr);

    let slotDisplay = "尚未選擇時段";
    if (selectedSlots.length > 0) {
        const daysOrder = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7 };
        const sortedSlots = [...selectedSlots].sort((a, b) => {
            const [dayA, timeA] = a.split('-');
            const [dayB, timeB] = b.split('-');
            if (daysOrder[dayA] !== daysOrder[dayB]) return daysOrder[dayA] - daysOrder[dayB];
            return timeA.localeCompare(timeB);
        });

        let lastDate = "";
        const formattedList = sortedSlots.map(slot => {
            const [dayName, time] = slot.split('-');
            const daysMap = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6 };
            const baseDate = new Date(weekDateStr);
            baseDate.setDate(baseDate.getDate() + daysMap[dayName]);
            const dateDisplay = `${baseDate.getMonth() + 1}/${baseDate.getDate()}`;

            let separator = "";
            if (lastDate !== "" && lastDate !== dateDisplay) {
                separator = "━━━━━━━━━━━━━━\n";
            }
            lastDate = dateDisplay;
            return `${separator}● **${dateDisplay} (${dayName})** 🕙 ${time}`;
        });
        slotDisplay = formattedList.join('\n');
    }

    const content = {
        username: BOT_NAME,
        embeds: [{
            title: `⚔️ Artale Raid Hub | ${weekLabel}`,
            description: `成員 ${userTag} 剛剛更新了可參加時段！`,
            color: 0xD35400,
            fields: [
                ...(hasBoss ? [{ name: "🎯 預定目標 (BOSS)", value: `**${bossName}**`, inline: true }] : []),
                { name: "📅 已選擇時段", value: slotDisplay, inline: false }
            ],
            // 🌟 這裡原本的版本號 footer 已經刪除了
            timestamp: new Date()
        }]
    };

    try {
        await fetch(WEBHOOK_UPDATE, { // 發送到【個人戰報】頻道
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(content)
        });
    } catch (error) {
        console.error('❌ 個人更新 Discord 發送失敗:', error);
    }
};

// ---------------------------------------------------------
// 2. 滿 6 人自動發送的廣播通知
// ---------------------------------------------------------
export const sendTeamReadyAlert = async (slotId, members, bossName) => {
    const [dayName, time] = slotId.split('-');

    const tags = members.map(m => {
        let tagFormat = '';
        if (m.discord_id) {
            tagFormat = `<@${m.discord_id}>`;
        } else if (/^\d{17,19}$/.test(m.contact_info)) {
            tagFormat = `<@${m.contact_info}>`;
        } else {
            tagFormat = `**${m.user_name}**`;
        }
        return `🗡️ ${tagFormat}`;
    }).join('\n'); // 一位一排

    const content = {
        username: BOT_NAME,
        content: `🚨 **【${bossName || 'BOSS 討伐'}】滿團確認！** 🚨\n請下列成員準備集合！`,
        embeds: [{
            title: `⚔️ 預定出發時間：週${dayName} ${time}`,
            description: `👥 **出戰成員：**\n${tags}`,
            color: 0x27AE60, // 綠色代表成團
            footer: { text: "Artale Raid Hub 遠征隊秘書" },
            timestamp: new Date()
        }]
    };

    try {
        await fetch(WEBHOOK_ALERT, { // 發送到【出團通知】頻道
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(content)
        });
    } catch (error) {
        console.error('❌ 滿團廣播發送失敗:', error);
    }
};

// ---------------------------------------------------------
// 3. ⏰ 新增：出團前 1 小時定時鬧鐘 (透過 Upstash QStash)
// ---------------------------------------------------------
export const scheduleReminder = async (slotId, members, bossName, weekDateStr) => {
    // ⚠️ 貼上你剛剛在 Upstash 複製的那串 QSTASH_TOKEN
    const QSTASH_TOKEN = "eyJVc2VySUQiOiI5NjIwMDI5ZC1jNWY4LTQxOWUtYjFjYS0xNDRiZjIxOGM2NDIiLCJQYXNzd29yZCI6IjI3OGRkNmRmMDg0YzQ3MWJiZjgwZDgxMWZjMWEwOWMyIn0=";

    // 1. 精準計算開打時間的毫秒數
    const [dayName, time] = slotId.split('-');
    const daysMap = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6 };

    // 算出那天的確切日期
    const raidDate = new Date(weekDateStr);
    raidDate.setDate(raidDate.getDate() + daysMap[dayName]);

    // 算出確切的小時與分鐘
    const [hours, minutes] = time.split(':');
    raidDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const raidTimeMs = raidDate.getTime();
    const reminderTimeMs = raidTimeMs - (60 * 60 * 1000); // 減去 1 小時 (毫秒)
    const nowMs = Date.now();

    // 計算距離「提醒時間」還有幾秒
    const delaySeconds = Math.floor((reminderTimeMs - nowMs) / 1000);

    // 💡 防呆機制：如果距離開打已經不到 1 小時 (例如壓秒成團)，就不設鬧鐘了
    if (delaySeconds <= 0) {
        console.log("出團時間不到1小時，自動取消預約鬧鐘");
        return;
    }

    // 2. 準備名單
    const tags = members.map(m => {
        let tagFormat = '';
        if (m.discord_id) {
            tagFormat = `<@${m.discord_id}>`;
        } else if (/^\d{17,19}$/.test(m.contact_info)) {
            tagFormat = `<@${m.contact_info}>`;
        } else {
            tagFormat = `**${m.user_name}**`;
        }
        return `🗡️ ${tagFormat}`;
    }).join('\n');

    // 3. 準備送給 Discord 的最終訊息
    const content = {
        username: BOT_NAME,
        content: `⏰ **【最後通牒：開戰倒數 1 小時】**\n🚨 **${bossName || 'BOSS 討伐'}** 預計在 **${time}** 準時開打！\n請下列成員確認裝備、藥水，準備上線集合：\n\n${tags}`
    };

    // 4. 交給 Upstash QStash 寄送未來信件
    try {
        // 🌟 修正 1：換成你截圖上的「美國地區」專屬網址
        const qstashUrl = `https://qstash-us-east-1.upstash.io/v2/publish/${WEBHOOK_ALERT}`;

        // 🌟 修正 2：確保延遲時間絕對是正整數 (最少延遲 1 秒)，避免 QStash 報錯
        const finalDelay = Math.max(1, delaySeconds);

        await fetch(qstashUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${QSTASH_TOKEN}`,
                'Content-Type': 'application/json',
                'Upstash-Delay': `${finalDelay}s`
            },
            body: JSON.stringify(content)
        });
        console.log('✅ 1小時前鬧鐘預約成功！');
    } catch (error) {
        console.error('❌ 鬧鐘預約失敗:', error);
    }
};