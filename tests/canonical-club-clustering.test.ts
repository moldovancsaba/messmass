import {
  canonicalizeClub,
  isGenericVisionDescription,
  SPORT_FRANCHISES_DIRECTORY,
} from '@/lib/brandEntityClustering';

describe('Canonical Sports Club Clustering & Entity Separation', () => {
  describe('isGenericVisionDescription', () => {
    it('rejects descriptive vision model captions', () => {
      expect(isGenericVisionDescription('Handball team with blue jersey')).toBe(true);
      expect(isGenericVisionDescription('Handball team wearing red and black jerseys')).toBe(true);
      expect(isGenericVisionDescription('Handball team with blue and white colors')).toBe(true);
      expect(isGenericVisionDescription('Handball Team Name')).toBe(true);
      expect(isGenericVisionDescription('Handball Family')).toBe(true);
      expect(isGenericVisionDescription("Handball team wearing maroon and yellow jerseys")).toBe(true);
      expect(isGenericVisionDescription("{'name': 'FTC', 'color': 'green'}")).toBe(true);
    });

    it('rejects commercial sponsor / sponsor placeholders from club lists', () => {
      expect(isGenericVisionDescription('FC Szerencsejáték Zrt.')).toBe(true);
      expect(isGenericVisionDescription('FC Szerencsésiak')).toBe(true);
      expect(isGenericVisionDescription('Borsodi')).toBe(true);
      expect(isGenericVisionDescription('Tippmix')).toBe(true);
    });

    it('allows real sports club names', () => {
      expect(isGenericVisionDescription('Győri Audi ETO KC')).toBe(false);
      expect(isGenericVisionDescription('One Veszprém HC')).toBe(false);
      expect(isGenericVisionDescription('FTC Rail Cargo Hungária')).toBe(false);
      expect(isGenericVisionDescription('OTP Bank - PICK Szeged')).toBe(false);
      expect(isGenericVisionDescription('PLER-Budapest')).toBe(false);
      expect(isGenericVisionDescription('Hungary National Handball Team')).toBe(false);
    });
  });

  describe('canonicalizeClub', () => {
    it('canonicalizes Győri Audi ETO KC variations into single entity', () => {
      const v1 = canonicalizeClub('Győri Audi ETO KC');
      const v2 = canonicalizeClub('Győri ETO KC');
      const v3 = canonicalizeClub('GYŐRI ETO KÉZILABDA CLUB');
      const v4 = canonicalizeClub('Hajrá Győr!');
      const v5 = canonicalizeClub('Audi ETO');

      expect(v1?.canonicalName).toBe('Győri Audi ETO KC');
      expect(v2?.canonicalName).toBe('Győri Audi ETO KC');
      expect(v3?.canonicalName).toBe('Győri Audi ETO KC');
      expect(v4?.canonicalName).toBe('Győri Audi ETO KC');
      expect(v5?.canonicalName).toBe('Győri Audi ETO KC');
    });

    it('canonicalizes FTC Rail Cargo Hungária variations', () => {
      const v1 = canonicalizeClub('FTC Rail Cargo Hungária');
      const v2 = canonicalizeClub('FTC Rail Cargo');
      const v3 = canonicalizeClub('Rail Cargo Hungaria');
      const v4 = canonicalizeClub('FTC kézilabda');

      expect(v1?.canonicalName).toBe('FTC Rail Cargo Hungária');
      expect(v2?.canonicalName).toBe('FTC Rail Cargo Hungária');
      expect(v3?.canonicalName).toBe('FTC Rail Cargo Hungária');
      expect(v4?.canonicalName).toBe('FTC Rail Cargo Hungária');
    });

    it('canonicalizes One Veszprém HC variations (including legacy Telekom / MKB names)', () => {
      const v1 = canonicalizeClub('One Veszprém HC');
      const v2 = canonicalizeClub('Telekom Veszprém');
      const v3 = canonicalizeClub('MKB Veszprém KC');
      const v4 = canonicalizeClub('Veszprém Handball');
      const v5 = canonicalizeClub('HC Veszprém KSE');

      expect(v1?.canonicalName).toBe('One Veszprém HC');
      expect(v2?.canonicalName).toBe('One Veszprém HC');
      expect(v3?.canonicalName).toBe('One Veszprém HC');
      expect(v4?.canonicalName).toBe('One Veszprém HC');
      expect(v5?.canonicalName).toBe('One Veszprém HC');
    });

    it('canonicalizes OTP Bank - PICK Szeged variations', () => {
      const v1 = canonicalizeClub('OTP Bank - PICK Szeged');
      const v2 = canonicalizeClub('Pick Szeged Handball');
      const v3 = canonicalizeClub('FICK Szeged handball');

      expect(v1?.canonicalName).toBe('OTP Bank - PICK Szeged');
      expect(v2?.canonicalName).toBe('OTP Bank - PICK Szeged');
      expect(v3?.canonicalName).toBe('OTP Bank - PICK Szeged');
    });

    it('canonicalizes PLER-Budapest variations', () => {
      const v1 = canonicalizeClub('PLER-Budapest');
      const v2 = canonicalizeClub('PLER KC');
      const v3 = canonicalizeClub('PLER');

      expect(v1?.canonicalName).toBe('PLER-Budapest');
      expect(v2?.canonicalName).toBe('PLER-Budapest');
      expect(v3?.canonicalName).toBe('PLER-Budapest');
    });

    it('canonicalizes Videoton and Fehérvár variations into single entity', () => {
      const v1 = canonicalizeClub('Videoton FC Fehérvár');
      const v2 = canonicalizeClub('Fehérvár FC');
      const v3 = canonicalizeClub('videoton');
      const v4 = canonicalizeClub('Székesfehérvár');

      expect(v1?.canonicalName).toBe('Videoton FC Fehérvár');
      expect(v2?.canonicalName).toBe('Videoton FC Fehérvár');
      expect(v3?.canonicalName).toBe('Videoton FC Fehérvár');
      expect(v4?.canonicalName).toBe('Videoton FC Fehérvár');
    });

    it('canonicalizes Újpest variations into Újpest FC', () => {
      const v1 = canonicalizeClub('Újpest FC');
      const v2 = canonicalizeClub('FC Ujpest');
      const v3 = canonicalizeClub('UTE');
      const v4 = canonicalizeClub('ujpest');

      expect(v1?.canonicalName).toBe('Újpest FC');
      expect(v2?.canonicalName).toBe('Újpest FC');
      expect(v3?.canonicalName).toBe('Újpest FC');
      expect(v4?.canonicalName).toBe('Újpest FC');
    });

    it('canonicalizes Ferencvárosi TC variations', () => {
      const v1 = canonicalizeClub('Ferencvárosi TC');
      const v2 = canonicalizeClub('Fradi');
      const v3 = canonicalizeClub('FTC');

      expect(v1?.canonicalName).toBe('Ferencvárosi TC');
      expect(v2?.canonicalName).toBe('Ferencvárosi TC');
      expect(v3?.canonicalName).toBe('Ferencvárosi TC');
    });

    it('returns null for generic sports and vision captions', () => {
      expect(canonicalizeClub('Handball team with blue jersey')).toBeNull();
      expect(canonicalizeClub('Handball team wearing red and black jerseys with Tippmix')).toBeNull();
      expect(canonicalizeClub('Ice Hockey')).toBeNull();
      expect(canonicalizeClub('Handball')).toBeNull();
      expect(canonicalizeClub('Football')).toBeNull();
    });
  });
});
