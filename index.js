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
            
            for (let i = 0; i < images.length; i++) {
                const imgData = images[i];
                const caption = `IMAGE ${i + 1}: ${imgData.step}\n\nPROMPT: ${imgData.prompt.substring(0, 200)}...`;
                
                await ctx.reply(`Generating Image ${i + 1}/6: ${imgData.step}...`);
                
                try {
                    // Add "photorealistic, cinematic, 8k, drone view" to ensure quality if prompt is missing it
                    const enhancedPrompt = `${imgData.prompt}, photorealistic, 8k, cinematic, drone view, ${selectedStructure}`;
                    const imageBuffer = await generateImage(enhancedPrompt, i + 1);
                    await ctx.replyWithPhoto({ source: imageBuffer }, { caption: caption });
                } catch (imgError) {
                    console.error(`Failed to generate image ${i+1}`, imgError);
                    await ctx.reply(`❌ Failed to generate Image ${i+1}. Prompt used:\n${imgData.prompt}`);
                }
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

bot.launch().then(() => {
    console.log('Cinematic Construction Bot is running...');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
