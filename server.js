import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import cors from "cors";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createViteServer } from "vite";
import { globby } from "globby";

// To get this working well, have a local file that contains data such as which folders to watch
// Have something watching that local file
// Have a route that writes to that local file
// Therefore, from the client, you can control which folder on your local computer

// Also, generate JSON files that save your settings per video
// Instead of directly changing the video src, you load the JSON and set is3d, isVr, src, FOV, zoom, etc. from that

/* 
The things to get working are: 
- Controller and mouse inputs (requires separate system and will likely port hand 
  inputs over to this one)
- Flat videos, 2D and 3D (seems simple enough, but curved plane seems more difficult)
- Seekbar (genuinely most difficult and stressful thing)
- Drag handles for re-positioning and scaling (I hate manually dragging the UI itself)
- Decoupling dragged item from hands
- layers (for better UI rendering)
- Sending video file list data from server rather than manually setting in client
- Better file browsing in client
- Proper settings UI

Then, it just needs a good UI and code clean up and its basically done.
Thinking of a frosted glass look as it is very annoying that the UI blocks videos but
I also need the UI to still be there.
*/

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VID_DIR_PATH = "" // Obviously put your path here

// Load your certificate and key
const options = {
  key: fs.readFileSync("./localhost-key.pem"),
  cert: fs.readFileSync("./localhost.pem"),
};

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Use vite's connect instance as middleware. If you use your own
  // express router (express.Router()), you should use router.use
  // When the server restarts (for example after the user modifies
  // vite.config.js), `vite.middlewares` is still going to be the same
  // reference (with a new internal stack of Vite and plugin-injected
  // middlewares). The following is valid even after restarts.

  app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });

  app.use(vite.middlewares);

  app.use("/assets/", express.static("src/assets"));
  // Serve static files from the "public" directory
  app.use("/p/:preview", cors(), (req, res) => {
    console.log(req.originalUrl.replace("%20", " "));
    let file = fs.readFileSync(
      VID_DIR_PATH + req.originalUrl.slice(2).replace("%20", " ")
    );
    res.end(file);
  });

  app.use("/videos", cors(), async (req, res, next) => {
    const paths = await globby("**.mp4", {
      absolute: false,
      cwd: VID_DIR_PATH,
      stats: true,
      onlyFiles: true,
    });
    res.json(paths);
  });
  app.use("/:video", cors(), (req, res) => {
    console.log(req.originalUrl.replace("%20", " "));
    let file = VID_DIR_PATH + req.originalUrl.replace("%20", " ");
    fs.stat(file, function (err, stats) {
      if (err) {
        if (err.code === "ENOENT") {
          // 404 Error if file not found
          return res.sendStatus(404);
        }
        res.end(err);
      }

      var range = req.headers.range;
      if (!range) {
        // 416 Wrong range
        return res.sendStatus(416);
      }

      var positions = range.replace(/bytes=/, "").split("-");
      var start = parseInt(positions[0], 10);
      var total = stats.size;
      var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      var chunksize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      });

      var stream = fs
        .createReadStream(file, { start: start, end: end })
        .on("open", function () {
          stream.pipe(res);
        })
        .on("error", function (err) {
          res.end(err);
        });
    });
  });

  app.get("/", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. Read index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, "index.html"),
        "utf-8"
      );

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
      //    and also applies HTML transforms from Vite plugins, e.g. global
      //    preambles from @vitejs/plugin-react
      template = await vite.transformIndexHtml(url, template);

      // 3. Load the server entry. ssrLoadModule automatically transforms
      //    ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      const { render } = await vite.ssrLoadModule("/src/entry-server.ts");
      // 4. render the app HTML. This assumes entry-server.js's exported
      //     `render` function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const appHtml = await render(url);
      console.log(appHtml);

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace(`<!--ssr-outlet-->`, appHtml);

      // 6. Send the rendered HTML back.
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  //app.listen(5173);
  https.createServer(options, app).listen(3001);
}

createServer();
