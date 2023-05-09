import { test, expect } from "vitest";

test("dateFormat", async () => {
    const { getDate } = await import('../src/utils');
    console.log(getDate());
    // console.log(getDate(undefined, 'YYYY'));
});

test("htmlReplace", () => {
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        #css
    </head>
    <body>
        <div>11111111</div>
        #js
    </body>
    </html>>
    `;
    html = html.replace(/(#css)/, `
        <link href="" rel="stylesheet />
    `).replace(/(#js)/, `
        <script src=""></script>
    `);
    console.log(html);
});

test("unit8", () => {
  
});