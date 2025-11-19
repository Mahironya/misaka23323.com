import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

const md = `This is inline math: $x^2$ and block:

$$
\\frac{a}{b}
$$
`;

console.log(marked(md));
