import { MantineThemeOverride, MantineTheme } from '@mantine/core';

declare const gdsTheme: MantineTheme;
declare function extendGdsTheme(overrides?: MantineThemeOverride): MantineTheme;

export { extendGdsTheme, gdsTheme };
