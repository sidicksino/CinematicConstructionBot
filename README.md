# Cinematic Construction Bot 🏗️🎬

A Telegram bot that generates a cinematic architectural construction workflow using AI.

## Features
- **Interactive Selection**: Choose from 10 architectural styles.
- **AI Prompt Generation**: Uses Google Gemini to create detailed, consistent prompts.
- **Photorealistic Images**: Generates 6 sequential construction images using FLUX.1 (via Hugging Face).
- **Video Prompts**: Provides detained image-to-video prompts for animation.

## Setup

1.  **Prerequisites**:
    - Node.js installed.
    - API Keys in `.env`: `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `HF_TOKEN`.

2.  **Configuration**:
    The project is located in `SnapChat/CinematicConstructionBot`.
    Dependencies are already installed.

## How to Run

1.  Open a terminal.
2.  Navigate to the project folder:
    ```bash
    cd /Users/abakar/Desktop/project/SnapChat/CinematicConstructionBot
    ```
3.  Start the bot:
    ```bash
    node index.js
    ```
4.  **Usage**:
    - Open your Telegram bot.
    - Type `/start`.
    - Select a structure number (e.g., `1`).
    - Wait for the magic! 🎥

## Tech Stack
- **Framework**: Telegraf (Node.js)
- **LLM**: Google Gemini 1.5 Flash
- **Image Gen**: FLUX.1-dev (Hugging Face Inference API)
# CinematicConstructionBot
