import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BiuDefaultAuthPage } from "../src/auth-page.js";
import { BiuErrorBoundary, BiuErrorDetails, BiuStatusView } from "../src/components.js";
import type { BiuRuntimeConfig } from "../src/types.js";

test("默认认证页使用公开组件控件并保留页面根契约", () => {
  const markup = renderToStaticMarkup(React.createElement(BiuDefaultAuthPage));

  assert.match(markup, /class="biu-auth-page"/);
  assert.match(markup, /class="biu-auth-card"/);
  assert.match(markup, /biu-ui-textfield/);
  assert.match(markup, /biu-auth-field/);
  assert.match(markup, /biu-ui-button/);
  assert.match(markup, /登录/);
});

test("状态页、错误详情和刷新动作复用公共 Result/Alert/Button", () => {
  const statusMarkup = renderToStaticMarkup(
    React.createElement(BiuStatusView, {
      status: 500,
      message: "服务暂不可用",
      details: "Error: service unavailable",
      locale: "zh-CN",
    }),
  );
  const detailsMarkup = renderToStaticMarkup(
    React.createElement(BiuErrorDetails, { message: "失败", details: "stack", locale: "zh-CN" }),
  );
  const boundary = new BiuErrorBoundary({
    config: { appId: "runtime-test", routes: [], pageRegistry: {} } as BiuRuntimeConfig,
    children: null,
    locale: "zh-CN",
  });
  boundary.state = { error: new Error("render failed"), componentStack: "at Test" };
  const boundaryMarkup = renderToStaticMarkup(boundary.render() as React.ReactElement);

  assert.match(statusMarkup, /biu-pro-result/);
  assert.match(statusMarkup, /biu-error-details/);
  assert.match(statusMarkup, /biu-ui-button/);
  assert.match(detailsMarkup, /biu-copy-button/);
  assert.match(detailsMarkup, /biu-ui-button/);
  assert.match(boundaryMarkup, /biu-ui-alert/);
  assert.match(boundaryMarkup, /biu-ui-button/);
});
