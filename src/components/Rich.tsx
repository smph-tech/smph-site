import { Fragment, type ReactNode } from 'react';

/**
 * Renders a content string with three bits of inline markup:
 *   <grad>word</grad>  gradient headline word
 *   <em>word</em>      emphasis (italic, as in the reference)
 *   [placeholder]      anything in square brackets, wrapped so it can be found
 */
const TOKEN = /(<grad>.*?<\/grad>|<em>.*?<\/em>|\[[^\]]+\])/g;

export function Rich({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<grad>')) {
          return (
            <span key={i} className="grad">
              <Rich text={part.slice(6, -7)} />
            </span>
          );
        }
        if (part.startsWith('<em>')) {
          return (
            <em key={i}>
              <Rich text={part.slice(4, -5)} />
            </em>
          );
        }
        if (part.startsWith('[')) {
          return (
            <span key={i} data-placeholder="">
              {part}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Strips markup for places that need plain text (alt text, meta, JSON-LD). */
export const plain = (text: string) => text.replace(/<\/?(grad|em)>/g, '');
