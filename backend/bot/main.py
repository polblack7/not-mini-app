import asyncio
import logging

from aiogram import Bot, Dispatcher, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.filters.command import CommandStart
from aiogram.types import (
    BotCommand,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

from core.config import get_settings
from core.db import get_db

router = Router()


@router.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    settings = get_settings()
    db = get_db()
    if message.from_user:
        filter_doc = {"telegram_user_id": message.from_user.id}
        update_doc = {"telegram_user_id": message.from_user.id, "chat_id": message.chat.id}
        if message.message_id is not None:
            filter_doc["last_start_message_id"] = {"$ne": message.message_id}
            update_doc["last_start_message_id"] = message.message_id
        result = await db.telegram_users.update_one(
            filter_doc,
            {"$set": update_doc},
            upsert=True,
        )
        if message.message_id is not None and result.matched_count == 0 and result.upserted_id is None:
            return
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Open ØNE-ARB",
                    web_app=WebAppInfo(url=settings.miniapp_url or "https://example.com"),
                )
            ]
        ]
    )
    await message.answer(
        "Welcome to ØNE-ARB. Tap the button below to open the Mini App.", reply_markup=keyboard
    )


@router.message(Command("help"))
async def help_handler(message: Message) -> None:
    await message.answer(
        "Use /start to open the ØNE-ARB Mini App and connect your wallet. "
        "After connecting, you can start/stop the bot and review reports."
    )


async def main() -> None:
    settings = get_settings()
    if not settings.bot_token:
        raise RuntimeError("BOT_TOKEN is not set")

    bot = Bot(token=settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    dp.include_router(router)
    miniapp_url = settings.miniapp_url or "https://example.com"
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Open the Mini App"),
            BotCommand(command="help", description="Usage instructions"),
        ]
    )
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(text="Start", web_app=WebAppInfo(url=miniapp_url))
    )
    await dp.start_polling(bot)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
