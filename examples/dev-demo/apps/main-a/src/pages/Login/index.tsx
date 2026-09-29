import { useState } from "react";
import { useBiuContext, useBiuI18n, type BiuAuthPageMode, type BiuAuthPageProps } from "@biugle/biu-runtime";
import { Button, TextField, biuMessage } from "@biugle/react-components";
import { demoCredentials } from "../../mock/auth";
import { demoText } from "../../mock/copy";
import "./styles.css";

export function DemoAuthPage({ mode, onModeChange }: BiuAuthPageProps) {
  const { $t, locale } = useBiuI18n();
  const { setAuth, navigateByKey } = useBiuContext();
  const [username, setUsername] = useState<string>(demoCredentials.username);
  const [password, setPassword] = useState<string>(demoCredentials.password);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "LOGIN" && (username !== demoCredentials.username || password !== demoCredentials.password)) {
      biuMessage.error(demoText(locale, "invalid"));
      return;
    }
    setAuth({
      mode: "SSO",
      authenticated: true,
      user: { id: "demo-user", name: "演示用户", role: "Portal Admin", extra: { source: "dev-demo" } },
    });
    biuMessage.success($t(mode === "LOGIN" ? "登录成功" : "注册成功，已进入首页"));
    navigateByKey("SystemConfig/SystemAdvanced/Dashboard", { replace: true });
  };
  return (
    <section className="biu-login-page">
      <form className="biu-login-card" onSubmit={submit}>
        <p className="biu-login-eyebrow">BIU AUTH</p>
        <h1>{$t(mode === "LOGIN" ? "登录" : "注册")}</h1>
        <p>{mode === "LOGIN" ? demoText(locale, "hint") : demoText(locale, "registerHint")}</p>
        <label>
          <span>{$t("账号")}</span>
          <TextField
            className="biu-login-field"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          <span>{$t("密码")}</span>
          <TextField
            className="biu-login-field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <Button type="primary" htmlType="submit" block>
          {$t(mode === "LOGIN" ? "登录" : "注册")}
        </Button>
        <Button
          type="default"
          variant="text"
          block
          className="biu-login-link"
          onClick={() => onModeChange((mode === "LOGIN" ? "REGISTER" : "LOGIN") as BiuAuthPageMode)}
        >
          {$t(mode === "LOGIN" ? "注册新账号" : "返回登录")}
        </Button>
      </form>
    </section>
  );
}

export default DemoAuthPage;
