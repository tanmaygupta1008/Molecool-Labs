/**
 * Parses a chemical formula string (e.g. "H2O", "H3O4P") and
 * returns an array of React-renderable parts with numbers wrapped in <sub>.
 *
 * Usage:
 *   import { formulaToJSX } from '@/utils/formulaUtils';
 *   <span>{formulaToJSX("H3O4P")}</span>
 */
export function formulaToJSX(formula) {
    if (!formula) return null;
    // Split on transitions between letters and digits
    const parts = formula.match(/([A-Za-z]+|\d+)/g) || [];
    return parts.map((part, i) =>
        /^\d+$/.test(part)
            ? <sub key={i} style={{ fontSize: '0.72em', verticalAlign: 'sub', lineHeight: 0 }}>{part}</sub>
            : <span key={i}>{part}</span>
    );
}
