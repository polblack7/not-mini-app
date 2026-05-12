import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Field } from "../ui/Field";
import { NoticeSlot } from "../ui/Notice";
import { PrimaryButton } from "../ui/Button";
import { TextInput } from "../ui/TextInput";

export const SecurityCard = ({ notice, onUpdate }) => {
  const [token, setToken] = useState("");
  return (
    <Card>
      <NoticeSlot notice={notice} />
      <Field label="Change access token">
        <TextInput
          type="password"
          value={token}
          onChange={setToken}
          placeholder="New access token"
        />
      </Field>
      <PrimaryButton
        block
        glow={false}
        onClick={() => {
          if (!token.trim()) return;
          onUpdate(token.trim());
          setToken("");
        }}
      >
        Update token
      </PrimaryButton>
    </Card>
  );
};
