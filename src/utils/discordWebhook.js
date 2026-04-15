// src/utils/discordWebhook.js

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1494038268344406116/bOpqn8DlcFEpTu_rYr7BypBvsKUmfrj7VaG66OqamUNs11-wB5EKoqnuCeOsiR-irFtH';
const BOT_NAME = "遠征隊秘書";
const BOT_AVATAR = "https://ui-avatars.com/api/?name=秘書&background=8B4513&color=fff&rounded=true&font-size=0.4"; // 秘書頭像

// ---------------------------------------------------------
// 1. 個人更新班表的通知 (你原本的功能)
// ---------------------------------------------------------
export const sendPersonalUpdate = async (userName, selectedSlots, weekDateStr, bossName) => {
    const hasBoss = bossName && bossName !== 'personal' && bossName !== '';

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
        avatar_url: BOT_AVATAR,
        embeds: [{
            title: `⚔️ Artale Raid Hub | ${weekLabel}`,
            description: `成員 **${userName}** 剛剛更新了可參加時段！`,
            color: 0xD35400,
            fields: [
                ...(hasBoss ? [{ name: "🎯 預定目標 (BOSS)", value: `**${bossName}**`, inline: true }] : []),
                { name: "📅 已選擇時段", value: slotDisplay, inline: false }
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
        // 🌟 1. 優先使用系統自動抓取的真實 Discord ID (百分百準確)
        if (m.discord_id) {
            return `<@${m.discord_id}>`;
        }
        // 2. 如果沒有 (可能是舊資料)，才退回去看他有沒有手動填
        if (/^\d{17,19}$/.test(m.contact_info)) {
            return `<@${m.contact_info}>`;
        }
        // 3. 真的都抓不到，才標記純文字名字
        return `**${m.user_name}**`;
    }).join(' ');

    const content = {
        username: BOT_NAME,
        avatar_url: BOT_AVATAR,
        content: `🚨 **【${bossName || 'BOSS 討伐'}】滿團確認！** 🚨\n請下列成員準備集合！`,
        embeds: [{
            title: `⚔️ 預定出發時間：週${dayName} ${time}`,
            description: `👥 **出戰成員：**\n${tags}`,
            color: 0x27AE60, // 綠色
            footer: { text: "Artale Raid Hub 遠征隊秘書" },
            timestamp: new Date()
        }]
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(content)
        });
    } catch (error) {
        console.error('❌ 滿團廣播發送失敗:', error);
    }
};