/**
 * Server features shown on the home page, the Overview and the FAQ.
 * The numbers mirror the game server's settings (goomba-xi-server: settings/main.lua,
 * settings/map.lua, modules/goomba/lua/solo_trusts.lua and trust_shop.lua). If you change a
 * rate there, change it here too, then `sudo goomba web-update`.
 */
export type Feature = { title: string; badge: string; summary: string; details: string[] }

export const FEATURES: Feature[] = [
  {
    title: 'Triple experience',
    badge: '3× EXP',
    summary: 'Three times the experience points from monsters, quests and missions.',
    details: [
      'Every kill gives triple experience points, in parties and solo.',
      'Experience rewards from quests and missions are tripled too.',
      'Level 50 to start, raised to 75 through Maat’s Limit Break quests, as in 2007.'
    ]
  },
  {
    title: 'Faster combat and magic skill-ups',
    badge: '3× gains',
    summary: 'Each weapon, defensive or magic skill-up is about three times as large.',
    details: [
      'A typical skill-up raises the skill by 0.3 instead of 0.1.',
      'The most a single skill-up can give goes from 0.5 to 0.9.',
      'How often skill-ups happen is unchanged; automaton skills benefit too.'
    ]
  },
  {
    title: 'Faster crafting',
    badge: '2× chance',
    summary: 'Synthesis raises your crafting skill twice as often.',
    details: [
      'Below skill 50 a successful synthesis almost always gives a skill-up.',
      'From skill 50 up the chance doubles from about 25% to about 50%.',
      'High-quality rates, recipes and guild ranks are retail.'
    ]
  },
  {
    title: 'Fishing, faster',
    badge: '2× chance',
    summary: 'Fishing is open, and a catch raises your fishing skill twice as often.',
    details: [
      'Fish, bait, rods and bite rates are retail; only the skill-up chance is doubled.',
      'Fishing quests and the fishing guilds are available.'
    ]
  },
  {
    title: 'Trusts for solo play',
    badge: 'Up to 5',
    summary: 'Call up to five trusts at once, with five starters from day one and over a hundred more to unlock.',
    details: [
      'Every character knows Excenmille, Kupipi, Naji, Ayame and Shantotto from the first login: a tank, a healer, two melee and a black mage.',
      'The Trust Liaison in Lower Jeuno teaches 102 more for conquest points, in tiers that open when any of your jobs reaches level 20, 30, 40, 50, 60, 70 and 75 (1,000 to 5,000 points each).',
      'Trusts follow retail’s rules: not in towns or in battles that forbid them, and only a solo player or party leader can call them.',
      'Trusts of jobs from later expansions (Geomancer, Rune Fencer, Dancer and Scholar) are not available.'
    ]
  }
]
