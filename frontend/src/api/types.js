/**
 * @typedef {{ code: string, message: string }} ApiError
 */

/**
 * @template T
 * @typedef {{ ok: boolean, data?: T, error?: ApiError }} ApiResponse
 */

/**
 * @typedef {{
 *   wallet_address: string,
 *   created_at?: string,
 *   last_login?: string,
 *   total_profit: number,
 *   successful_arbs: number,
 *   avg_profitability: number
 * }} Profile
 */

/**
 * @typedef {{ token: string, profile: Profile }} LoginResponse
 */

/**
 * @typedef {{
 *   min_profit_pct: number,
 *   loan_limit: number,
 *   dex_list: string[],
 *   pairs: string[],
 *   scan_frequency_sec: number,
 *   updated_at?: string
 * }} Settings
 */

/**
 * @typedef {{
 *   current_profit: number,
 *   completed_deals: number,
 *   avg_profitability: number
 * }} BotKpis
 */

/**
 * @typedef {{
 *   status: "active" | "stopped" | "error" | string,
 *   last_error?: string | null,
 *   kpis: BotKpis
 * }} BotStatus
 */

/**
 * @typedef {{
 *   id?: string,
 *   timestamp: string,
 *   pair: string,
 *   dex: string,
 *   profit: number,
 *   fees: number,
 *   exec_time_ms: number,
 *   status: "success" | "fail" | string,
 *   error_message?: string | null
 * }} OpRecord
 */

/**
 * @typedef {{
 *   total_profit: number,
 *   successful_arbs: number,
 *   avg_profitability: number,
 *   success_rate: number
 * }} StatsSummary
 */

/**
 * @typedef {{
 *   id?: string,
 *   created_at: string,
 *   type: string,
 *   title: string,
 *   message: string,
 *   read: boolean
 * }} Notification
 */

/**
 * @typedef {{
 *   id?: string,
 *   created_at: string,
 *   level: string,
 *   message: string,
 *   context?: Record<string, unknown>
 * }} LogEntry
 */

/**
 * @typedef {{
 *   id: string,
 *   pair: string,
 *   dex: string,
 *   expected_profit_pct: number,
 *   liquidity_score: number
 * }} Opportunity
 */

export {};
