import React, { useState } from "react";
import { ConnectForm, Splash } from "../components/connect";

const PHASE = { SPLASH: "splash", FORM: "form" };

export default function ConnectPage() {
  const [phase, setPhase] = useState(PHASE.SPLASH);
  return phase === PHASE.SPLASH ? (
    <Splash onContinue={() => setPhase(PHASE.FORM)} />
  ) : (
    <ConnectForm onBack={() => setPhase(PHASE.SPLASH)} />
  );
}
