import { useCallback, useEffect, useState } from "react";
import { useBiuAuthContext, useBiuContext, useBiuI18n, type BiuPortalSlots } from "@biugle/biu-runtime";
import { TextField, biuMessage } from "@biugle/react-components";
import { Glyph, HeaderMenuItem } from "@biugle/biu-preset/toolbar";
import DemoAuthPage from "./pages/Login";
import { demoCredentials } from "./mock/auth";
import { demoText } from "./mock/copy";
import "./portal-slots.css";

const timezoneOptions = [
  { code: "Asia/Shanghai", label: "UTC+08 · Shanghai" },
  { code: "Europe/London", label: "UTC+00 · London" },
  { code: "America/New_York", label: "UTC-05 · New York" },
];

function TimezoneMenu({ close }: { close: () => void }) {
  const { timezone, setTimezone } = useBiuContext();
  return (
    <>
      {timezoneOptions.map((option) => (
        <HeaderMenuItem
          key={option.code}
          icon={<Glyph name="clock" />}
          active={option.code === timezone}
          onClick={() => {
            setTimezone(option.code);
            close();
          }}
        >
          {option.label}
        </HeaderMenuItem>
      ))}
    </>
  );
}

function DemoWorkbar() {
  const { $t } = useBiuI18n();
  const [value, setValue] = useState("");
  return (
    <div className="biu-demo-workbar">
      <TextField
        className="biu-demo-workbar-field"
        addonBefore={<Glyph name="search" />}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={$t("门户工作栏")}
        aria-label={$t("门户工作栏")}
      />
    </div>
  );
}

type AccountPanelProps = {
  close: () => void;
  registerSubmit: (submit: () => void | boolean | Promise<void | boolean>) => void;
};

function ProfilePanel({ close, registerSubmit }: AccountPanelProps) {
  const { $t } = useBiuI18n();
  const { auth, setAuth } = useBiuAuthContext();
  const [name, setName] = useState(auth?.user?.name || "");
  const user = auth?.user;
  const save = useCallback(() => {
    setAuth(
      auth
        ? { ...auth, user: { ...user, id: user?.id || "demo-user", name, role: user?.role, extra: user?.extra } }
        : auth,
    );
    biuMessage.success($t("个人信息已保存"));
  }, [$t, auth, name, setAuth, user]);
  useEffect(() => registerSubmit(save), [registerSubmit, save]);
  return (
    <form
      className="biu-account-panel-form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
        close();
      }}
    >
      <label>
        <span>{$t("姓名")}</span>
        <TextField className="biu-account-panel-field" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        <span>{$t("角色")}</span>
        <TextField className="biu-account-panel-field" value={user?.role || "-"} readOnly />
      </label>
    </form>
  );
}

function PasswordPanel({ close, registerSubmit }: AccountPanelProps) {
  const { $t, locale } = useBiuI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const save = useCallback(() => {
    if (current !== demoCredentials.password || !next.trim()) {
      biuMessage.error($t("当前密码不正确或新密码为空"));
      return false;
    }
    biuMessage.success(demoText(locale, "passwordChanged"));
    return true;
  }, [$t, current, locale, next]);
  useEffect(() => registerSubmit(save), [registerSubmit, save]);
  return (
    <form
      className="biu-account-panel-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (save() !== false) close();
      }}
    >
      <label>
        <span>{$t("当前密码")}</span>
        <TextField
          className="biu-account-panel-field"
          type="password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      <label>
        <span>{$t("新密码")}</span>
        <TextField
          className="biu-account-panel-field"
          type="password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          autoComplete="new-password"
        />
      </label>
    </form>
  );
}

const portalSlots: BiuPortalSlots = {
  authPage: DemoAuthPage,
  profilePanel: (close, registerSubmit) => <ProfilePanel close={close} registerSubmit={registerSubmit} />,
  passwordPanel: (close, registerSubmit) => <PasswordPanel close={close} registerSubmit={registerSubmit} />,
  workbar: <DemoWorkbar />,
  toolbarActions: [
    {
      code: "timezone",
      label: "时区",
      labelKey: "时区",
      value: ({ timezone }) => timezone || "Asia/Shanghai",
      tooltip: "Switch time zone",
      tooltipKey: "切换时区",
      icon: <Glyph name="clock" />,
      content: (close) => <TimezoneMenu close={close} />,
    },
  ],
};

export default portalSlots;
