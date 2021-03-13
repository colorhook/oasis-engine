const fs = require("fs");
const path = require("path");

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import glslify from "rollup-plugin-glslify";
import inject from "@rollup/plugin-inject";
import replace from "@rollup/plugin-replace";

const camelCase = require("camelcase");

const { NODE_ENV } = process.env;

const pkgsRoot = path.join(__dirname, "packages");
const pkgs = fs
  .readdirSync(pkgsRoot)
  .map((dir) => path.join(pkgsRoot, dir))
  .map((location) => {
    return {
      location: location,
      pkgJson: require(path.resolve(location, "package.json"))
    };
  });

// "oasisEngine" 、 "@oasisEngine/controls" ...
function toGlobalName(pkgName) {
  return camelCase(pkgName);
}

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const commonPlugins = [
  resolve({ extensions, preferBuiltins: true }),
  glslify({
    include: [/\.glsl$/, "packages/**/worker/**/*.js"]
  }),
  babel({
    extensions,
    babelHelpers: "bundled",
    exclude: ["node_modules/**", "packages/**/node_modules/**"]
  }),
  commonjs()
];

/** start */
const outdir = path.join(__dirname, 'dist');
const module = "@oasis-engine/wechat-adapter";
function register(name) {
  return [module, name];
}
const adapterArray = [
  "window",
  "WebGLRenderingContext",
  "WebGL2RenderingContext",
  "devicePixelRatio",
  "document",
  "Element",
  "Event",
  "EventTarget",
  "HTMLCanvasElement",
  "HTMLElement",
  "HTMLMediaElement",
  "HTMLVideoElement",
  "Image",
  "navigator",
  "Node",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "performance",
  "WechatAdapter",
];
const adapterVars = {};

adapterArray.forEach((name) => {
  adapterVars[name] = register(name);
});
/** end */

/** remap plugin */
function remap(options) {
  return {
    name: 'remap',
    resolveId(id, importer) {
      if (id in options) {
        return this.resolve(options[id], importer);
      }
      return null;
    },
  }
}

const adapterRemap = {
  './OrbitControl': './WechatOrbitControl'
}

function config({ location, pkgJson }) {
  const input = path.join(location, "src", "index.ts");
  const external = Object.keys(pkgJson.dependencies || {});
  const name = pkgJson.name;
  commonPlugins.push(
    replace({
      'process.env.WECHAT': 'true',
      __buildVersion: pkgJson.version
    })
  );

  return {
    module: () => {
      const plugins = [remap(adapterRemap), ...commonPlugins, inject(adapterVars)];
      return {
        input,
        external,
        output: [
          {
            file: path.join(outdir, pkgJson.name, 'index.js'),
            format: "cjs",
            sourcemap: false
          },
        ],
        plugins
      };
    }
  };
}

async function makeRollupConfig({ type, compress = true, visualizer = true, ..._ }) {
  return config({ ..._ })[type](compress, visualizer);
}

let promises = [];

switch (NODE_ENV) {
  case "WECHAT":
    promises.push(...getWechat());
    break;
  default:
    break;
}

function getWechat() {
  const configs = [...pkgs];
  return configs
    .map((config) => makeRollupConfig({ ...config, type: "module" }));
}

export default Promise.all(promises);
