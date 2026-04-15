// src/utils/discordWebhook.js

// 🌟 1. 填入【個人戰報 (排班更新)】頻道的正式 Webhook (記得換回測試用網址如果你正在測試)
const WEBHOOK_UPDATE = 'https://discord.com/api/webhooks/1493654863312195784/YE09_033lvIkcTVYywv-TukS-Ef1Osd2VD11lIxPgqm3d-2PYzQLyvf4G3rAVCUs2GR0';

// 🌟 2. 填入【出團通知 (滿團廣播)】頻道的正式 Webhook
const WEBHOOK_ALERT = 'https://discord.com/api/webhooks/1494038268344406116/bOpqn8DlcFEpTu_rYr7BypBvsKUmfrj7VaG66OqamUNs11-wB5EKoqnuCeOsiR-irFtH';

const BOT_NAME = "遠征隊秘書";

// 🌟 全新生成：遠征隊秘書專屬高質感 SVG 頭像 (Base64 編碼)
// 設計元素：深棕色皮革、金色羽毛筆與捲軸圖騰
const BOT_AVATAR_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjY0IiBjeTBoxNiIgcj0iNjAiIGZpbGw9IiM4QjQ1MTMiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjY0IiByPSI1NiIgc3Ryb2tlPSIjRkZEOzAwIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBmaWxsPSIjRkZEOzAwIiBkPSJNOTQuMjM1IDI5LjU5MWMtMS4xNy0xLjE2Mi0yLjg4Ni0xLjUzNC00LjcyNi0xLjExNEw2MS44NCA0MS45NzVsLTE1LjkyMy0xNS44Yy0xLjI1LTEuMjMtMy4xNDgtMS42LTQuNjU3LTEuMTJsLTMuMjMgMS4wM2MtMS41MjUuNDg1LTIuMjg5IDIuMTI0LTIuMDgyIDMuNzdsMS4wNzUgNy45NmMuMTkuMTI1LjMzMi4zNDguNDAzLjU2NGwxLjgzNSA1LjIzYy4zNjUuNzM0IDEuMDI5IDEuMzM1IDEuODA0IDEuNTE0bDkuMTczIDEuOTA2YzEuMDE3LjI2MyAyLjEyNi4wMyAyLjg4Ny0uNjUybDE2LjgzLTE1LjM2MyA5Ljg4NSAxNy41OTJjLS4zNS43NzctLjUxOSAxLjU1My0uNDgxIDIuNDlsLjQ1OCAxMS41Yy4xNTIgMy44MTMgMi4wMTIgNi4zNTQgNC44MDYgNy44NzVsLTMwLjIyNSA4Ljg4N2MtNS4wNSAxLjQ4NS04LjEwNyA2LjI5LTcuNDQ4IDExLjMzN2wuMDU4LjY4OWMuNjQzIDQuNTgzIDQuNTkyIDcuODkgOS4wNyA4LjIzMmwuNjk2LjA0OGwzMS43LTIuODgyYy43Ny4yNiAxLjY1NS40MzQgMi41NjMuNDcybDMuOTU5LjE3Yy44NTEuMDY3IDEuNjcuMDA2IDIuNDAzLS4yMDdsMS44MzcgMS44MDhjLjc5NC43OCAxLjc3MyAxLjIyMiAyLjgyIDEuMjg2bDEzLjEyOC44MDVjMS41NDUuMDk1IDIuOTk4LS43NzYgMy41MzUtMi4xOWwuNzk0LTIuMDYyYy40NDktMS4xNjQuMTcxLTIuNDUxLS42Ni0zLjE5OWwtMS44OTItMS44MDFjLjI1Ny0uODI0LjM3LTEuNzU0LjMwOC0yLjc0NWwtLjM5NC05LjgxOGMtLjEzNy0zLjM1MS0xLjcyLTUuNDk5LTQuMDM0LTcuMDAxbC05LjY0LTE0LjUxNyAxOC43MS05LjEzMmM0Ljc0LTIuMzg1IDUuNjItNi43IDMuMzE5LTguODU4ek03My40IDc1LjMyNWMuMzA4LTIuMjMtLjI2NS00LjI5OC0xLjYzLTUuODUxYy0xLjM2NS0xLjU1My0zLjM3Ni0yLjI3NS01LjcwNS0yLjA0M0w0OS4xODggNjkuN2MtMy4xMzIuMzA2LTUuNTM2IDIuODMyLTYuMTkxIDUuODNsLS4wNC4xODljLS43NzggMy42NjUgMS4zNjQgNi41ODUgNC45MDUgOC41MzJsMzUuNzUgMjAuMzU5Yy0uMTI3LjExNy0uMjU3LjI0LS4zOTguMzQ5bC0zLjU4NCAyLjc4N2MtNS4zNDMgNC4xNTYtMTMuNjM5IDEuOTE4LTE2LjU2OC00LjQ4OGwtNy44NzUtMTcuMTU0Yy0uNTUtMS4yLTIuMDA3LTIuMDE3LTMuNTMzLTEuODk4bC00LjY4NS4zNjVjLTEuNzg3LjE0LTIuOTQzIDIuMDE1LTIuNDAyIDMuOTZsNy42NTQgMTYuNjM4Yy42MSAxLjMyNCAxLjgyIDIuMjEgMy4xNzMgMi40NWw1LjMxLjkwOGMtLjAxMy41MS0uMTU2IDEuMDA3LS40NTYgMS40NDlsLTUuMTQ0IDcuODkyYy0uNzg1IDEuMi0uNzgxIDIuODMyLjAxNiA0LjAzbDEuNjcyIDIuNWMuNDU4LjY4OSAxLjIyNSAxLjExMiAyLjAxOSAxLjE0NWwuMjEyLjAwNmM4LjY5NC4yOTQgMTkuMTY2Ljg4MSAyNS44NTcgMS4yM2EuNjgxLjY4MSAwIDAgMCAuNzQ2LS43MzdsLjAxLS41MjNjLjM3LTIuNzg1LS4zOTMtNS41NDMtMi4wODgtOC4wODVsLTcuMTM3LTkuNjY5Yy0uNzA1LS45NTQtMS40OTYtMS43NjYtMi4zNDUtMi40MTljLjAyOS0uNTE2LjEzLS45ODcuMzM0LTEuNDE3bDUuMjgzLTguMDc4Yy44MjUtMS4yNy44NzMtMi45NS4xNC00LjMyem0tMjUuNzE2IDcuNzU2Yy0uOTAyLTEuMTQ0LTEuMDkyLTIuNzA0LS42MzMtMy45MzlsLjUxMi0xLjM4NGMuMzU2LS45NiAxLjI4LTEuNTkzIDIuMjU5LTEuNTkzIC4wODMgMCAuMTY4LjAwNC4yNTQuMDEybDkuMzMzIDEuMDFjMS45NjkuMjE0IDIuOTgxIDIuMjY4IDIuMDYgMy43NTVsLTkuNDY4IDkuMTUzYy0xLjI0MyAxLjIwMS0zLjA2NCAxLjIxNC00LjMxNS4wNTR6Ii8+PC9nPjwvc3ZnPg==";


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
        avatar_url: BOT_AVATAR_SVG, // 🌟 使用全新 SVG 頭像
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
        avatar_url: BOT_AVATAR_SVG, // 🌟 使用全新 SVG 頭像
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