import katex, { KatexOptions } from 'katex';

type ExtendedOptions = KatexOptions & {
    nonStandard?: boolean;
    fallbackDpi?: number;
};

const inlineRule = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1(?=[\s?!\.,:？！。，：]|$)/;
const inlineRuleNonStandard = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1/;
const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;

export default function markedKatexWithFallback(options: ExtendedOptions = {}) {
    return {
        extensions: [
            inlineKatex(options, createRenderer(options, false)),
            blockKatex(options, createRenderer(options, true)),
        ],
    };
}

interface KatexToken {
    text: string;
    displayMode: boolean;
}

function createRenderer(options: ExtendedOptions, newlineAfter: boolean) {
    return (token: KatexToken) => renderWithFallback(token, options, newlineAfter);
}

function renderWithFallback(token: KatexToken, options: ExtendedOptions, newlineAfter: boolean) {
    const texSource = token.text;
    const displayMode = token.displayMode;
    const katexMarkup = katex.renderToString(texSource, {
        ...options,
        displayMode,
    });

    const escapedTex = escapeAttribute(texSource);
    const fallbackUrl = buildFallbackUrl(texSource, options.fallbackDpi);
    const wrapperTag = displayMode ? 'div' : 'span';
    const classes = displayMode ? 'math-fragment math-display' : 'math-fragment math-inline';
    const fallbackImg = fallbackUrl
        ? `<img class="math-fallback" src="${fallbackUrl}" alt="${escapedTex}" loading="lazy">`
        : '';

    return `<${wrapperTag} class="${classes}" data-tex="${escapedTex}">${katexMarkup}${fallbackImg}</${wrapperTag}>${newlineAfter ? '\n' : ''}`;
}

function inlineKatex(options: ExtendedOptions, renderer: (token: KatexToken) => string) {
    const nonStandard = options && options.nonStandard;
    const ruleReg = nonStandard ? inlineRuleNonStandard : inlineRule;
    return {
        name: 'inlineKatex',
        level: 'inline' as const,
        start(src: string) {
            let index: number | undefined;
            let indexSrc = src;

            while (indexSrc) {
                index = indexSrc.indexOf('$');
                if (index === -1) {
                    return;
                }
                const fits = nonStandard ? index > -1 : index === 0 || indexSrc.charAt(index - 1) === ' ';
                if (fits) {
                    const possibleKatex = indexSrc.substring(index);
                    if (possibleKatex.match(ruleReg)) {
                        return index;
                    }
                }
                indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
            }
        },
        tokenizer(src: string) {
            const match = src.match(ruleReg);
            if (match) {
                return {
                    type: 'inlineKatex',
                    raw: match[0],
                    text: match[2].trim(),
                    displayMode: match[1].length === 2,
                };
            }
        },
        renderer,
    };
}

function blockKatex(options: ExtendedOptions, renderer: (token: KatexToken) => string) {
    return {
        name: 'blockKatex',
        level: 'block' as const,
        tokenizer(src: string) {
            const match = src.match(blockRule);
            if (match) {
                return {
                    type: 'blockKatex',
                    raw: match[0],
                    text: match[2].trim(),
                    displayMode: match[1].length === 2,
                };
            }
        },
        renderer,
    };
}

function buildFallbackUrl(tex: string, dpi = 180) {
    const prefix = `https://latex.codecogs.com/png.image?%5Cdpi%7B${dpi}%7D%20`;
    return prefix + encodeURIComponent(tex).replace(/%20/g, '+');
}

function escapeAttribute(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
