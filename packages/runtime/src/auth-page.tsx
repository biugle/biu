import React, { useState } from "react";
import { Button, TextField, biuMessage } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "./context.js";
import type { BiuAuthPageMode, BiuAuthPageProps } from "./types.js";

export function BiuDefaultAuthPage() {
  const { $t } = useBiuI18n();
  const { requestAuth } = useBiuContext();
  const [mode, setMode] = useState<BiuAuthPageMode>("LOGIN");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!account.trim() || !password.trim()) {
      biuMessage.error($t("请填写完整注册信息"));
      return;
    }
    requestAuth("LOGIN");
  };
  return (
    <main className="biu-auth-page">
      <form className="biu-auth-card" onSubmit={submit}>
        <p className="biu-auth-eyebrow">BIU AUTH</p>
        <h1>{mode === "LOGIN" ? $t("登录") : $t("注册")}</h1>
        <p>{$t("请通过统一身份认证完成访问")}</p>
        <label>
          <span>{$t("账号")}</span>
          <TextField
            className="biu-auth-field"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          <span>{$t("密码")}</span>
          <TextField
            className="biu-auth-field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "LOGIN" ? "current-password" : "new-password"}
          />
        </label>
        <Button type="primary" htmlType="submit" block>
          {mode === "LOGIN" ? $t("登录") : $t("注册")}
        </Button>
        <Button
          type="default"
          variant="text"
          block
          className="biu-auth-switch"
          onClick={() => setMode(mode === "LOGIN" ? "REGISTER" : "LOGIN")}
        >
          {mode === "LOGIN" ? $t("注册新账号") : $t("返回登录")}
        </Button>
      </form>
    </main>
  );
}

export function BiuAuthGate({ page: AuthPage }: { page?: React.ComponentType<BiuAuthPageProps> }) {
  const [mode, setMode] = useState<BiuAuthPageMode>("LOGIN");
  return AuthPage ? <AuthPage mode={mode} onModeChange={setMode} /> : <BiuDefaultAuthPage />;
}
