import React from "react";
import { Card } from "../ui/Card";
import { ChipGroup } from "../ui/ChipGroup";
import { Field } from "../ui/Field";
import { NoticeSlot } from "../ui/Notice";
import { NumberInput } from "../ui/NumberInput";
import { PrimaryButton } from "../ui/Button";
import { DEX_OPTIONS, PAIR_OPTIONS } from "../../constants/markets";

/**
 * Pure form component — takes settings + onChange + onSave. All async/notice
 * state is owned by the page.
 */
export const StrategyForm = ({ settings, onChange, onSave, notice }) => {
  const patch = (partial) => onChange({ ...settings, ...partial });

  return (
    <Card>
      <NoticeSlot notice={notice} />

      <Field label="Tokens / Pairs">
        <ChipGroup
          variant="pair"
          options={PAIR_OPTIONS}
          value={settings.pairs}
          onChange={(pairs) => patch({ pairs })}
        />
      </Field>

      <Field label="Min profit">
        <NumberInput
          value={settings.min_profit_pct}
          onChange={(v) => patch({ min_profit_pct: v })}
          suffix="%"
        />
      </Field>
      <Field label="Loan limit">
        <NumberInput
          value={settings.loan_limit}
          onChange={(v) => patch({ loan_limit: v })}
          suffix="ETH"
        />
      </Field>

      <Field label="DEX selection">
        <ChipGroup
          variant="dex"
          options={DEX_OPTIONS}
          value={settings.dex_list}
          onChange={(dex_list) => patch({ dex_list })}
        />
      </Field>

      <Field label="Scan frequency">
        <NumberInput
          value={settings.scan_frequency_sec}
          onChange={(v) => patch({ scan_frequency_sec: v })}
          suffix="sec"
          step={1}
          min={1}
        />
      </Field>

      <PrimaryButton block onClick={onSave}>
        Save strategy
      </PrimaryButton>
    </Card>
  );
};
