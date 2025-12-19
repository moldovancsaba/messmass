// WHAT: Utility functions for chart label formatting
// WHY: Keep specific phrases together on one line (e.g., "Opt-in %")
// HOW: Replace spaces with non-breaking spaces for exception phrases

/**
 * List of phrases that should never break across lines
 */
const NO_BREAK_PHRASES = [
  'Opt-in %',
  'Opt-in',
  'E-mail',
  'Set-up',
  'Follow-up',
  'Sign-up',
  'Check-in',
  'Pop-up',
];

/**
 * Replaces spaces in specific phrases with non-breaking spaces
 * to prevent them from breaking across lines
 * 
 * @param text - The text to process
 * @returns Text with non-breaking spaces in protected phrases
 * 
 * @example
 * preventPhraseBreaks("Marketing Opt-in %")
 * // Returns: "Marketing Opt-in\u00A0%"
 * // Breaks as: "Marketing" / "Opt-in %"
 */
export function preventPhraseBreaks(text: string | undefined): string {
  if (!text) return '';
  
  let result = text;
  
  // Replace each protected phrase with non-breaking space version
  NO_BREAK_PHRASES.forEach(phrase => {
    // Case-insensitive replacement
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, (match) => {
      // Replace all spaces in the matched phrase with non-breaking spaces
      return match.replace(/ /g, '\u00A0');
    });
  });
  
  return result;
}
