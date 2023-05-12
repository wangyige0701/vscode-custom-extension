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

test("sort", () => {
    const a = '/* index(1) */';
    const b = '/* index(2) */';
    const c = '/* index(3) */';
    const index = a.match(/\/\* index\((\d*)\) \*\//);
    
    let list: string[] = [];
    const position: number[] = [];
    [c, b, a].forEach((str: string) => {
        str = str.toString();
        let index: number | RegExpMatchArray | null  = str.match(/\/\* index\((\d*)\) \*\//);
        index = index ? parseFloat(index[1]) : 0;
        // (list as string[]).splice(index, 0, str);

        if (list.length === 0 || index >= position[position.length-1]) {
            list.push(str);
            position.push(index);
        } else if (index <=  position[0]) {
            list.unshift(str);
            position.unshift(index);
        } else {
            let length = position.length;
            function a (length: number, array: number[], target: number, start: number = 0) {
                let l = length / 2;
                if (length % 2 > 0) l--;
                let i = start + l;
                let n = array[i];
                if (length === 3 || length === 2) return n > target ? i : i+1;
                if (target >= n) {
                    return a(array.length-i, array, target, i);
                } else {
                    return a(i+1, array, target, start);
                }
            }
            let res = a(length, position, index);
            list.splice(res, 0, str);
            position.splice(res, 0, index);
        }
    });
    const str = list.join('\n\n');
    console.log(str);
});

test("opacity", () => {
    function minmax (min: number, max: number, value: number): number {
        return value <= min ? min : value >= max ? max : value;
`   `}

    function dot (opacity: number) {
        opacity = minmax(0.1, 1, opacity);
        opacity = +(0.95 + (-0.45 * opacity)).toFixed(2);
        console.log(opacity);
        
    }
    dot(11);
});

test("regexp", () => {
    // const a = 'version [ ${extensionVer} ]';
    // const reg = a.match(new RegExp('version\\s\*\\[\\s\*(\\S\*)\\s\*\\]'));
    // console.log(reg);

    const b = '/* wangyige.background.start */\n/**\n* extensionVersion [ 0.0.1 ]\n* date [ 2023-0  5-11 23:34:21 ]\n* imageCode [ rru51wr92p668m8eehy83e1q ]\n*/\nbody {\n   opacity: 0.81;\n   background-repeat: no-repeat;\n   background-size: cover;\n   background-position: center;\n   background-image: \n}\n/* wangyige.background.end */'
    // const reg = /\/\* wangyige.background.start \*\/[\s\S]*extensionVersion\s*\[\s*(\S*[\s\S]*\S{1,})\s*\][\s\S]*date\s*\[\s*(\S*[\s\S]*\S{1,})\s*\][\s\S]*imageCode\s*\[\s*(\S*[\s\S]*\S{1,})\s*\][\s\S]*\/\* wangyige.background.end \*\//;
    const reg = /\/\* wangyige.background.start \*\/[\s\S]*date\s*\[\s*(\S*.*\S{1,})\s*\][\s\S]*\/\* wangyige.background.end \*\//;
    console.log(b.match(reg));

    // const a = '[   a   cb    bbb   ]'
    // const reg = /\[\s*([\S\s]*\S{1,})\s*\]/
    // console.log(a.match(reg));
    
    
})