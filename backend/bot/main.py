import asyncio
import logging

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.filters.command import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    BotCommand,
    KeyboardButton,
    MenuButtonWebApp,
    Message,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from core.config import get_settings
from core.db import get_db
from core.utils import now_utc

router = Router()

MAIN_MENU = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="Start Bot"), KeyboardButton(text="Stop Bot")],
        [KeyboardButton(text="Bot Status"), KeyboardButton(text="Set Threshold")],
    ],
    resize_keyboard=True,
)


class ThresholdState(StatesGroup):
    waiting_for_value = State()


async def get_wallet(telegram_user_id: int) -> str | None:
    db = get_db()
    mapping = await db.telegram_users.find_one({"telegram_user_id": telegram_user_id})
    return mapping.get("wallet_address") if mapping else None


@router.message(CommandStart())
async def command_start_handler(message: Message, state: FSMContext) -> None:
    await state.clear()
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
    await message.answer(
        "Welcome to ØNE-ARB. Use the menu below to control your bot.",
        reply_markup=MAIN_MENU,
    )


@router.message(Command("help"))
async def help_handler(message: Message) -> None:
    await message.answer(
        "Use /start to open the menu.\n"
        "Start Bot / Stop Bot — enable or disable monitoring.\n"
        "Bot Status — check current state and operation count.\n"
        "Set Threshold — update the minimum profit % required to act on an opportunity."
    )


@router.message(F.text == "Start Bot")
async def start_bot_handler(message: Message) -> None:
    wallet = await get_wallet(message.from_user.id)
    if not wallet:
        await message.answer("Connect your wallet in the Mini App first.")
        return
    db = get_db()
    await db.bot_state.update_one(
        {"wallet_address": wallet},
        {"$set": {"status": "active", "last_change_at": now_utc(), "last_error": None}},
        upsert=True,
    )
    await message.answer("Bot started. Monitoring is active.")


@router.message(F.text == "Stop Bot")
async def stop_bot_handler(message: Message) -> None:
    wallet = await get_wallet(message.from_user.id)
    if not wallet:
        await message.answer("Connect your wallet in the Mini App first.")
        return
    db = get_db()
    await db.bot_state.update_one(
        {"wallet_address": wallet},
        {"$set": {"status": "stopped", "last_change_at": now_utc()}},
        upsert=True,
    )
    await message.answer("Bot stopped.")


@router.message(F.text == "Bot Status")
async def bot_status_handler(message: Message) -> None:
    wallet = await get_wallet(message.from_user.id)
    if not wallet:
        await message.answer("Connect your wallet in the Mini App first.")
        return
    db = get_db()
    state = await db.bot_state.find_one({"wallet_address": wallet})
    status = state.get("status", "stopped") if state else "stopped"
    ops_count = await db.ops.count_documents({"wallet_address": wallet})
    text = f"<b>Status:</b> {status}\n<b>Total operations:</b> {ops_count}"
    if state and state.get("last_error"):
        text += f"\n<b>Last error:</b> {state['last_error']}"
    await message.answer(text)


@router.message(F.text == "Set Threshold")
async def set_threshold_handler(message: Message, state: FSMContext) -> None:
    await state.set_state(ThresholdState.waiting_for_value)
    await message.answer("Enter the minimum profit threshold (%):")


@router.message(ThresholdState.waiting_for_value)
async def threshold_value_handler(message: Message, state: FSMContext) -> None:
    try:
        value = float(message.text.replace(",", "."))
    except (ValueError, AttributeError):
        await message.answer("Please enter a valid number, e.g. 0.3")
        return
    if value < 0 or value > 100:
        await message.answer("Threshold must be between 0 and 100.")
        return
    wallet = await get_wallet(message.from_user.id)
    if not wallet:
        await message.answer("Connect your wallet in the Mini App first.")
        await state.clear()
        return
    db = get_db()
    await db.settings.update_one(
        {"wallet_address": wallet},
        {"$set": {"min_profit_pct": value, "updated_at": now_utc()}},
        upsert=True,
    )
    await state.clear()
    await message.answer(f"Threshold updated to {value}%.")


async def main() -> None:
    settings = get_settings()
    if not settings.bot_token:
        raise RuntimeError("BOT_TOKEN is not set")

    bot = Bot(token=settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Open the menu"),
            BotCommand(command="help", description="Usage instructions"),
        ]
    )
    miniapp_url = settings.miniapp_url or "https://example.com"
    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(text="Open App", web_app=WebAppInfo(url=miniapp_url))
    )
    await dp.start_polling(bot)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
