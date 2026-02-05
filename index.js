const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { TELEGRAM_BOT_TOKEN } = require('./src/config');
const { generateConstructionPrompts } = require('./src/llm');
const { generateImage } = require('./src/imageGen');

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// State 2: Selection Mode Options
const STRUCTURE_OPTIONS = [
    "Skyscraper",
    "Luxury mansion",
    "Duplex",
    "Bungalow",
    "High-rise apartment",
    "Office tower",
    "Resort villa",
    "Commercial complex",
    "Modern estate",
    "Mixed-use development"
];

const WELCOME_MESSAGE = `
────────────────────────
STATE 1 — IDLE
Type "start" to begin the Cinematic Construction Workflow.
────────────────────────
`;

const SELECTION_MESSAGE = `
────────────────────────
STATE 2 — SELECTION MODE
Select a structure to build (1-10):

1. Skyscraper
2. Luxury mansion
3. Duplex
4. Bungalow
5. High-rise apartment
6. Office tower
7. Resort villa
8. Commercial complex
9. Modern estate
10. Mixed-use development

Reply with a number (1–10) and I will immediately generate the full exterior construction pipeline.
────────────────────────
`;

bot.command('start', (ctx) => {
    ctx.reply(SELECTION_MESSAGE);
});

bot.on(message('text'), async (ctx) => {
    const text = ctx.message.text.trim();
    const number = parseInt(text);

    if (!isNaN(number) && number >= 1 && number <= 10) {
        const selectedStructure = STRUCTURE_OPTIONS[number - 1];
        await ctx.reply(`STATE 3 — EXECUTION MODE\nSelected: ${selectedStructure}\nGenerating pipeline... (this make take a minute)`);

        try {
            // 1. Generate Prompts via Gemini
            const constructionData = await generateConstructionPrompts(selectedStructure);
            
            // Send Context Confirmation
            if (constructionData.context_confirmation) {
                await ctx.reply(`CONTEXT CONFIRMATION:\n${constructionData.context_confirmation}`);
            }

            // 2. Generate and Send Images
            const images = constructionData.images || [];
            
            // Fix a random seed for the entire sequence to ensure consistent camera angle
            const sequenceSeed = Math.floor(Math.random() * 1000000);
            console.log(`Starting sequence with Seed: ${sequenceSeed}`);

            // Parallel Execution Strategy: Batches of 3 to avoid rate limits but DOUBLE the speed
            const batchSize = 3;
            for (let i = 0; i < images.length; i += batchSize) {
                const batch = images.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (imgData, index) => {
                    const globalIndex = i + index;
                    const caption = `IMAGE ${globalIndex + 1}: ${imgData.step}\n\nPROMPT: ${imgData.prompt.substring(0, 200)}...`;
                    
                    try {
                        // Notify start (optional, maybe skip to reduce API spam? No, user likes status)
                        // ctx.reply is async, fire-and-forget here to save time? Better await to keep order? 
                        // Let's rely on the final photos sending.
                        
                        // Add consistency keywords AND strict negative prompting
                        // Ensuring "No text" comes LAST has the strongest effect
                        const enhancedPrompt = `Same fixed camera angle, same shot, same altitude. ${imgData.prompt}, photorealistic, 8k, cinematic, drone view, ${selectedStructure}. No text, no watermark, no logo, no timestamp, no drone UI, no OSD.`;
                        
                        const imageBuffer = await generateImage(enhancedPrompt, globalIndex + 1, sequenceSeed);
                        await ctx.replyWithPhoto({ source: imageBuffer }, { caption: caption });
                    } catch (imgError) {
                        console.error(`Failed to generate image ${globalIndex+1}`, imgError);
                        await ctx.reply(`⚠️ [Server Busy] Could not generate Image ${globalIndex+1}. (504 Error)`);
                    }
                }));
            }

            // 3. Send Video Prompts
            let videoMsg = "────────────────────────\nSTEP 3 — 5 IMAGE-TO-VIDEO PROMPTS\n\n";
            const videos = constructionData.videos || [];
            videos.forEach((vid, idx) => {
                videoMsg += `VIDEO ${idx + 1} (${vid.step}):\n${vid.prompt}\n\n`;
            });
            
            // Telegram has a message limit, so split if needed or send as file. 
            // For now, assume it fits or send roughly.
            if (videoMsg.length > 4000) {
                 await ctx.reply(videoMsg.substring(0, 4000));
                 await ctx.reply(videoMsg.substring(4000));
            } else {
                await ctx.reply(videoMsg);
            }

            await ctx.reply("────────────────────────\nDEPLOYMENT COMPLETE. Type 'start' to build another.");

        } catch (error) {
            console.error("Workflow Error:", error);
            await ctx.reply("❌ An error occurred during the workflow execution. Please try again.");
        }
    } else {
        // If not a number, maybe they typed 'start' or something else
        if (text.toLowerCase() === 'start') {
             ctx.reply(SELECTION_MESSAGE);
        } else {
             ctx.reply("Please reply with a number (1-10) to select a structure.");
        }
    }
});

console.log('Attempting to connect to Telegram...');
bot.launch().then(() => {
    console.log('Cinematic Construction Bot is running...');
    console.log('Send /start to your bot in Telegram to begin.');
}).catch((err) => {
    console.error('Failed to launch bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
