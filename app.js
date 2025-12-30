// VoidLight Keeper's Companion - Universal Campaign System
// Based on Hearts in the Void implementation

// ==================== CAMPAIGN TEMPLATES ====================
const BLANK_TEMPLATE = {
  sessionName: 'New Campaign',
  fearTokens: 0,
  currentScene: 1,
  notes: '',
  dashboardPins: { players: [], npcs: [], monsters: [] },
  clocks: [],
  players: [],
  npcs: [],
  monsters: [],
  scenes: [
    { id: 1, name: "Opening Scene", location: "Unknown", notes: "Set the stage for your adventure",
      details: { atmosphere: "Describe the atmosphere here...", objectives: ["Establish the setting"], 
        keyRolls: ["Example: Knowledge + Investigation (DC 12)"], npcsPresent: [],
        possibleOutcomes: ["Success: The story begins"], tips: "Make it memorable!" } }
  ],
  diceRoller: { modifier: 0, advantage: 'normal', difficulty: 15, results: null, rollHistory: [] }
};

const CAMPAIGN_TEMPLATES = [
  { id: "hearts_in_the_void", name: "Hearts in the Void", 
    description: "A complete adventure featuring the Iron Hearts crew, Hunger Weavers, and betrayal among the stars.",
    author: "VoidLight Core", scenes: 8, players: 6, npcs: 8, monsters: 4 },
  { id: "derelicts_secret", name: "The Derelict's Secret",
    description: "Quickstart adventure from the Core Rules. Investigate a time-looped freighter.",
    author: "VoidLight Quickstart", scenes: 5, players: 7, npcs: 2, monsters: 0 },
  { id: "example_campaign", name: "Example Campaign (Tutorial)",
    description: "A simple example campaign to learn the app features.",
    author: "Tutorial", scenes: 3, players: 2, npcs: 2, monsters: 1 }
];

let originalTemplate = null;
let campaignLoaded = false;

// ==================== CAMPAIGN SELECTION FUNCTIONS ====================
function showCampaignSelect() {
  const screen = $('#campaignSelectScreen');
  const app = $('#mainApp');
  if (screen) screen.classList.remove('hidden');
  if (app) app.classList.add('hidden');
  renderTemplateList();
}

function hideCampaignSelect() {
  const screen = $('#campaignSelectScreen');
  const app = $('#mainApp');
  if (screen) screen.classList.add('hidden');
  if (app) app.classList.remove('hidden');
}

function showTemplates() {
  const browser = $('#templateBrowser');
  const tutorial = $('#tutorialSection');
  if (browser) browser.classList.remove('hidden');
  if (tutorial) tutorial.classList.add('hidden');
  renderTemplateList();
}

function hideTemplates() {
  const browser = $('#templateBrowser');
  if (browser) browser.classList.add('hidden');
}

function showTutorial() {
  const tutorial = $('#tutorialSection');
  const browser = $('#templateBrowser');
  if (tutorial) tutorial.classList.remove('hidden');
  if (browser) browser.classList.add('hidden');
}

function hideTutorial() {
  const tutorial = $('#tutorialSection');
  if (tutorial) tutorial.classList.add('hidden');
}

function renderTemplateList() {
  const container = $('#templateList');
  if (!container) return;
  
  container.innerHTML = CAMPAIGN_TEMPLATES.map(template => `
    <div class="template-item">
      <div class="template-info">
        <div class="template-name">${escapeHtml(template.name)}</div>
        <div class="template-desc">${escapeHtml(template.description)}</div>
        <div class="template-meta">${template.scenes} scenes • ${template.players} players • ${template.npcs} NPCs</div>
      </div>
      <button class="template-load-btn" onclick="loadTemplate('${template.id}')">Load</button>
    </div>
  `).join('');
}

function startNewCampaign() {
  loadCampaignData(JSON.parse(JSON.stringify(BLANK_TEMPLATE)));
  originalTemplate = JSON.parse(JSON.stringify(BLANK_TEMPLATE));
  campaignLoaded = true;
  hideCampaignSelect();
  initializeMainApp();
}

function loadTemplate(templateId) {
  const data = getEmbeddedTemplate(templateId);
  if (data) {
    loadCampaignData(data);
    originalTemplate = JSON.parse(JSON.stringify(data));
    campaignLoaded = true;
    hideCampaignSelect();
    hideTemplates();
    initializeMainApp();
  } else {
    alert('Template not found');
  }
}

function loadCampaignFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      loadCampaignData(data);
      originalTemplate = JSON.parse(JSON.stringify(data));
      campaignLoaded = true;
      hideCampaignSelect();
      hideTemplates();
      initializeMainApp();
    } catch (err) {
      alert('Error loading campaign file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function loadCampaignFromMainApp(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      loadCampaignData(data);
      originalTemplate = JSON.parse(JSON.stringify(data));
      renderAll();
      updateSessionNameDisplay();
      alert('Campaign loaded successfully!');
    } catch (err) {
      alert('Error loading campaign file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function loadCampaignData(data) {
  state.sessionName = data.sessionName || 'New Campaign';
  state.fearTokens = data.fearTokens || 0;
  state.currentScene = data.currentScene || 1;
  state.notes = data.notes || '';
  state.dashboardPins = data.dashboardPins || { players: [], npcs: [], monsters: [] };
  state.clocks = data.clocks || [];
  state.players = data.players || [];
  state.npcs = data.npcs || [];
  state.monsters = data.monsters || [];
  state.scenes = data.scenes || [];
  state.diceRoller = data.diceRoller || { modifier: 0, advantage: 'normal', difficulty: 15, results: null, rollHistory: [] };
  state.spotlightFocus = null;
}

function saveCampaign() {
  const saveData = {
    sessionName: state.sessionName,
    fearTokens: state.fearTokens,
    currentScene: state.currentScene,
    notes: state.notes,
    dashboardPins: state.dashboardPins,
    clocks: state.clocks,
    players: state.players,
    npcs: state.npcs,
    monsters: state.monsters,
    scenes: state.scenes,
    diceRoller: { modifier: state.diceRoller.modifier, advantage: state.diceRoller.advantage, 
                 difficulty: state.diceRoller.difficulty, results: null, rollHistory: [] },
    savedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.sessionName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function showResetModal() {
  const modal = $('#resetModal');
  if (modal) modal.classList.remove('hidden');
}

function hideResetModal() {
  const modal = $('#resetModal');
  if (modal) modal.classList.add('hidden');
}

function resetToDefault() {
  if (originalTemplate && confirm('Reset to the original template? All changes will be lost.')) {
    loadCampaignData(JSON.parse(JSON.stringify(originalTemplate)));
    hideResetModal();
    renderAll();
    updateSessionNameDisplay();
  }
}

function resetToBlank() {
  if (confirm('Reset to a blank campaign? All data will be lost.')) {
    loadCampaignData(JSON.parse(JSON.stringify(BLANK_TEMPLATE)));
    originalTemplate = JSON.parse(JSON.stringify(BLANK_TEMPLATE));
    hideResetModal();
    renderAll();
    updateSessionNameDisplay();
  }
}

function exitCampaign() {
  if (confirm('Exit to campaign selection? Make sure to save your progress first!')) {
    campaignLoaded = false;
    showCampaignSelect();
  }
}

function updateSessionNameDisplay() {
  const input = $('#sessionNameInput');
  if (input) input.value = state.sessionName;
}

function initializeMainApp() {
  updateSessionNameDisplay();
  updateFearDisplay();
  document.body.classList.add('keeper-mode');
  renderAll();
}

// Hearts in the Void - Keeper's Companion
// Vanilla JavaScript Implementation

// ==================== STATE ====================
const state = {
  keeperMode: true,
  activeTab: 'dashboard',
  fearTokens: 0,
  currentScene: 1,
  notes: '',
  sessionName: 'Hearts in the Void - Session 1',
  lastSaved: null,
  spotlightFocus: null, // { type: 'player'|'npc'|'monster', id: number }
  hoveredAbility: null,
  modalAbilities: [], // Temporary abilities for add character modal
  editingAbilityIndex: null, // Index of ability being edited in modal
  
  dashboardPins: {
    players: [1, 2, 3, 4, 5, 6],
    npcs: [1, 3],
    monsters: [1]
  },
  
  clocks: [
    { id: 1, name: "Korren's Desperation", segments: 4, filled: 0, hidden: false },
    { id: 2, name: "Core Overload", segments: 4, filled: 0, hidden: false },
    { id: 3, name: "Structural Collapse", segments: 6, filled: 0, hidden: false },
    { id: 4, name: "The Swarm Catches You", segments: 4, filled: 0, hidden: false }
  ],
  
  players: [
    { id: 1, name: 'Spark', subtitle: 'Human Engineer', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 9, abilities: ['Scrap Genius (3 Hope)', 'Technical Intuition', 'Digital Ghost'], equipment: 'Plasma Pistol, Multi-tool, Hacking Kit' },
    { id: 2, name: 'Marcus', subtitle: 'Human Soldier', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 4, armorMinor: 8, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 9, abilities: ['Combat Surge (2 Hope)', 'Combat Focus', 'Bodyguard Protocol'], equipment: 'Assault Rifle, Riot Shield' },
    { id: 3, name: 'Whisper', subtitle: 'Ethereal Mystic', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 5, armorSevere: 11, armorSlots: 2, armorMarked: [], evasion: 10, abilities: ['Path to Nirvana (3 Hope)', 'Unbroken Focus', 'Veil Sight'], equipment: 'Ceremonial Robes, Emergency Blaster' },
    { id: 4, name: 'Dr. Lyra', subtitle: 'Kryllian Scholar', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 9, abilities: ['Eureka Moment (3 Hope)', 'Analytical Mind', 'Combat Medicine'], equipment: 'Medical Kit, Biological Scanner' },
    { id: 5, name: 'Flash', subtitle: 'Celestiari Pilot', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 5, armorSevere: 11, armorSlots: 2, armorMarked: [], evasion: 11, abilities: ['Veil Surge (3 Hope)', 'Stellar Instinct', "Pathfinder's Sense"], equipment: 'Energy Pistol, Starcharts' },
    { id: 6, name: 'Shadow', subtitle: 'Synthetic Scoundrel', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 4, armorMinor: 7, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 12, abilities: ['Vanishing Act (3 Hope)', 'Shadow Operative', 'Blend with Crowd'], equipment: 'Gauss Pistol, Morphic Key, Holo-Mask' }
  ],
  
  npcs: [
    { 
      id: 1, name: 'Zara Kaine', subtitle: 'Iron Hearts Captain', 
      hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, 
      armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 12, 
      description: "Pilot with a laugh like thunder. In love with Alexei. Can't cook—once started a fire in space.", 
      abilities: [
        { name: 'Expert Pilot', type: 'Passive', cost: 0, desc: '+2 to all piloting checks' },
        { name: 'Cover Fire', type: 'Action', cost: 1, desc: 'Suppress enemies, giving allies advantage on movement' }
      ],
      keeperNotes: 'Will NOT leave Alexei. Protective.', hidden: false, isAlly: true 
    },
    { 
      id: 2, name: 'Alexei Joric', subtitle: 'The "Kidnapped" Nobleman', 
      hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 1, 
      armor: 1, armorMinor: 3, armorSevere: 6, armorSlots: 1, armorMarked: [], evasion: 11, 
      description: 'Young poet with terrible poetry. Useless in combat. Quotes verse when nervous.', 
      abilities: [
        { name: 'Terrible Poetry', type: 'Action', cost: 0, desc: 'Recite poetry. Enemies may be distracted or annoyed' },
        { name: 'Noble Bearing', type: 'Passive', cost: 0, desc: '+1 to social checks with nobility' }
      ],
      keeperNotes: 'Non-combatant. Liability in fights.', hidden: false, isAlly: true 
    },
    { 
      id: 3, name: 'Brix', subtitle: 'Loyal Kryx', 
      hp: 10, maxHp: 10, stress: 0, maxStress: 6, hope: 2, 
      armor: 3, armorMinor: 6, armorSevere: 12, armorSlots: 3, armorMarked: [], evasion: 11, 
      description: "Massive wolf-alien. Doesn't understand human customs. Treats handshakes as combat.", 
      abilities: [
        { name: 'Brutal Charge', type: 'Action', cost: 1, desc: 'Charge and knockdown, +4 attack, 2d6 damage' },
        { name: 'Pack Loyalty', type: 'Reaction', cost: 1, desc: 'Intercept attack meant for Zara, take damage instead' },
        { name: 'Intimidating Presence', type: 'Passive', cost: 0, desc: 'Enemies have disadvantage on first attack against party' }
      ],
      keeperNotes: 'Charges biggest threat. Loyal to Zara.', hidden: false, isAlly: true 
    },
    { 
      id: 4, name: 'Korren', subtitle: 'The Traitor', 
      hp: 8, maxHp: 8, stress: 0, maxStress: 7, 
      armor: 5, armorMinor: 10, armorSevere: 20, armorSlots: 5, armorMarked: [], evasion: 10, 
      description: 'Kryllian engineer drowning in gambling debt. Worst luck in the galaxy.', 
      abilities: [
        { name: 'Heavy Weapons', type: 'Action', cost: 0, desc: '+3 attack with heavy weapons, 2d8 damage' },
        { name: 'Sabotage', type: 'Action', cost: 1, desc: 'Disable a system or device, DC 14 to notice' },
        { name: 'Engineering', type: 'Passive', cost: 0, desc: 'Can repair or jury-rig most tech' }
      ],
      keeperNotes: 'TRAITOR. Will betray when clock fills. Desperate, not evil.', hidden: true, isAlly: false 
    },
    { 
      id: 5, name: 'Thex', subtitle: 'The Manipulator', 
      hp: 6, maxHp: 6, stress: 0, maxStress: 6, 
      armor: 2, armorMinor: 4, armorSevere: 8, armorSlots: 2, armorMarked: [], evasion: 10, 
      description: "Ethereal obsessed with wealth. No idea what things cost. Makes dramatic pronouncements nobody listens to.", 
      abilities: [
        { name: 'Emotional Manipulation', type: 'Action', cost: 1, desc: 'DC 14 Presence or target believes a lie' },
        { name: 'Time Sight', type: 'Action', cost: 2, desc: 'Glimpse 1 round into future, gain advantage' }
      ],
      keeperNotes: 'TRAITOR. Works with Korren. Hangs back in fights.', hidden: true, isAlly: false 
    },
    { 
      id: 6, name: 'Madame Silk', subtitle: 'Assassin Leader', 
      hp: 8, maxHp: 8, stress: 0, maxStress: 6, 
      armor: 4, armorMinor: 7, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 15, 
      description: 'Rift Spinner assassin. Art snob about killing. Once let target live for better lighting.', 
      abilities: [
        { name: 'Camouflage', type: 'Action', cost: 1, desc: 'Become invisible until attack or damaged' },
        { name: 'Filament Strike', type: 'Action', cost: 0, desc: '+5 attack, 2d8 damage, ignores 2 armor' },
        { name: 'Ambush', type: 'Reaction', cost: 2, desc: 'When revealed, make free attack with advantage' }
      ],
      keeperNotes: 'Invisible until strikes. Flanks. Targets weakest.', hidden: true, isAlly: false 
    },
    { 
      id: 7, name: 'Scalpel', subtitle: 'Medical Torturer', 
      hp: 8, maxHp: 8, stress: 0, maxStress: 6, 
      armor: 3, armorMinor: 6, armorSevere: 12, armorSlots: 3, armorMarked: [], evasion: 12, 
      description: 'Inappropriately cheerful. Offers tea to torture victims. Hums while working.', 
      abilities: [
        { name: 'Surgical Strike', type: 'Action', cost: 0, desc: '+4 attack, 1d10 damage, +2 Stress on hit' },
        { name: 'Toxins', type: 'Action', cost: 1, desc: 'Apply poison: DC 13 or 1d6 damage per round' },
        { name: 'Medical Knowledge', type: 'Passive', cost: 0, desc: 'Can stabilize or harm with equal skill' }
      ],
      keeperNotes: 'Targets wounded. May offer "deals."', hidden: true, isAlly: false 
    },
    { 
      id: 8, name: 'Maya Santos', subtitle: 'Amaranth Agent', 
      hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 1, 
      armor: 2, armorMinor: 4, armorSevere: 8, armorSlots: 2, armorMarked: [], evasion: 11, 
      description: "Nothing surprises her anymore. Sighs constantly. Will nod at any plan.", 
      abilities: [
        { name: 'Concealed Weapon', type: 'Reaction', cost: 1, desc: 'Surprise attack when least expected, +3, 1d8' },
        { name: 'Information Network', type: 'Action', cost: 1, desc: 'Contact sources, learn one secret about target' }
      ],
      keeperNotes: 'Quest giver. Not meant for combat.', hidden: false, isAlly: true 
    }
  ],
  
  monsters: [
    { 
      id: 1, 
      name: 'Hunger Weaver', 
      subtitle: 'Individual', 
      hp: 4, maxHp: 4, stress: 0, maxStress: 3, 
      armor: 0, armorMinor: 6, armorSevere: 10, armorSlots: 0, armorMarked: [], 
      evasion: 12, 
      description: 'Crystalline jellyfish. Feeds on bio-electric energy.', 
      abilities: [
        { name: 'Draining Tentacle', type: 'Action', fearCost: 0, desc: '+3, 1d6 Magic, DC 13 or +1 Stress' },
        { name: 'Hypnotic Illusions', type: 'Action', fearCost: 1, desc: 'DC 12 Presence or Fascinated for 1 round' },
        { name: 'Fluid Form', type: 'Passive', fearCost: 0, desc: 'Can pass through 5cm gaps' }
      ],
      keeperNotes: 'Weak to bright light and high-frequency sound.', 
      hidden: false 
    },
    { 
      id: 2, 
      name: 'Weaver Swarm', 
      subtitle: '4-5 Weavers', 
      hp: 16, maxHp: 16, stress: 0, maxStress: 6, 
      armor: 0, armorMinor: 6, armorSevere: 10, armorSlots: 0, armorMarked: [], 
      evasion: 14, 
      description: 'Coordinated group. Sets ambushes. Learns.', 
      abilities: [
        { name: 'Multi-Attack', type: 'Action', fearCost: 1, desc: 'Attack 2 different targets' },
        { name: 'Swarm Tactics', type: 'Passive', fearCost: 0, desc: '+2 to hit when near allies' },
        { name: 'Overwhelming Numbers', type: 'Reaction', fearCost: 2, desc: 'When hit, spawn 1d4 new Weavers' }
      ],
      keeperNotes: 'More arrive every 2-3 rounds during chaos.', 
      hidden: true 
    },
    { 
      id: 3, 
      name: 'Weaver Queen (Phase 1)', 
      subtitle: 'Boss - The Sovereign', 
      hp: 25, maxHp: 25, stress: 0, maxStress: 0, 
      armor: 0, armorMinor: 8, armorSevere: 14, armorSlots: 0, armorMarked: [], 
      evasion: 13, 
      description: 'Size of a small car. Crown of eyes. Ancient and intelligent.', 
      abilities: [
        { name: 'Royal Tentacle', type: 'Action', fearCost: 0, desc: '+3, 2d6+3, DC 14 Str or dragged' },
        { name: 'Summon Children', type: 'Action', fearCost: 2, desc: 'Spawn 1d4 Weavers (2x per fight)' },
        { name: 'Hypnotic Cascade', type: 'Action', fearCost: 2, desc: 'Medium range, DC 14 Presence, all targets' },
        { name: 'Veil Shield', type: 'Reaction', fearCost: 1, desc: 'Reduce damage by half' }
      ],
      keeperNotes: 'Choose 2 actions per turn. Transforms at 0 HP.', 
      hidden: true 
    },
    { 
      id: 4, 
      name: 'Weaver Queen (Phase 2)', 
      subtitle: 'Boss - Hunger Ascendant', 
      hp: 20, maxHp: 20, stress: 0, maxStress: 0, 
      armor: 0, armorMinor: 10, armorSevere: 16, armorSlots: 0, armorMarked: [], 
      evasion: 15, 
      description: 'Expanded, pulsing with Veil energy. Your heartbeat is her heartbeat.', 
      abilities: [
        { name: 'Neural Feast', type: 'Action', fearCost: 1, desc: 'DC 17 Instinct, drain 1d8 HP, heal same, +2 Stress' },
        { name: 'Crystalline Eruption', type: 'Action', fearCost: 3, desc: 'Recharge 5-6, 20ft, DC 14 Agi, 3d6 + Immobilized' },
        { name: 'Phase Shift', type: 'Reaction', fearCost: 2, desc: 'Negate one attack, teleport Close range' },
        { name: 'Psychic Scream', type: 'Action', fearCost: 2, desc: 'All players DC 15 Presence or 2 Stress' }
      ],
      keeperNotes: 'Phase 2 after Phase 1 reaches 0 HP.', 
      hidden: true 
    }
  ],
  
  scenes: [
    { 
      id: 1, 
      name: 'Scene 1: The Offer', 
      location: 'Nexus Inferior Bar', 
      notes: 'Maya hires the crew. DC 12 Instinct to read her. DC 13 Presence for more info.',
      details: {
        atmosphere: 'The Nexus Inferior earns its name. Three levels below the main promenade, where the lighting is "atmospheric" because replacing the bulbs would cost money nobody has.',
        objectives: ['Meet Maya Santos', 'Learn about the job', 'Negotiate payment'],
        keyRolls: [
          'Instinct + Perception DC 12: Notice Maya\'s hidden nervousness',
          'Presence + Persuasion DC 13: Get more information about the kidnapping'
        ],
        npcsPresent: ['Maya Santos'],
        possibleOutcomes: [
          'Success with Hope: Maya reveals she works for House Amaranth',
          'Success with Fear: Maya becomes guarded, withholds info',
          'Players accept: Wealth Level 0 → 1, receive coordinates'
        ],
        tips: 'Play Maya as tired, professional, and genuinely worried. She sighs a lot.'
      }
    },
    { 
      id: 2, 
      name: 'Scene 2: Securing Transport', 
      location: 'Crossroads Station', 
      notes: 'Options: Buy ship, Book passage, or Steal The Collector (DC 16 heist).',
      details: {
        atmosphere: 'The docking levels of Crossroads Station buzz with activity. Merchants hawk wares, crews load cargo, and the Bone Dogs swagger through like they own the place.',
        objectives: ['Secure transport to Charon\'s Refuge', 'Choose method: Buy, Book, or Steal'],
        keyRolls: [
          'Option A - Buy Ship: Reduce Wealth Level to 0',
          'Option B - Book Passage: Keep Wealth Level 1',
          'Option C - Steal The Collector: Base DC 16 (reducible)',
          'The Mechanic DC 12: -2 to heist DC',
          'The Bartender DC 13: -2 to heist DC',
          'The Smuggler DC 14: -1 to heist DC'
        ],
        npcsPresent: ['Ratko (Bone Dogs)', 'Grond', 'Vek'],
        possibleOutcomes: [
          'Heist Success with Hope: +1 Rep with Unaligned, clean escape',
          'Heist Success with Fear: +1 Heat with House Volkov',
          'Heist Failure: Shootout, +2 Heat with authorities'
        ],
        tips: 'Everything goes wrong for Ratko. His eye glitches, he trips, gun jams. Comedy gold.'
      }
    },
    { 
      id: 3, 
      name: 'Scene 3: Arrival', 
      location: "Charon's Refuge", 
      notes: 'First Weaver encounter. Combat tutorial. ARIA-7 introduction.',
      details: {
        atmosphere: 'The station drifts in shadow, running lights flickering in strange patterns. The airlock opens to the smell of ozone, old metal, and something organic.',
        objectives: ['Explore the station', 'Survive first Weaver encounter', 'Find clues about other groups'],
        keyRolls: [
          'Knowledge + Tech DC 12: Access information terminal',
          'Instinct + Investigation DC 13: Find traces of occupation',
          'Combat: 2 Hunger Weavers (tutorial fight)'
        ],
        npcsPresent: ['ARIA-7 (potential ally)'],
        possibleOutcomes: [
          'Terminal Success: Learn Iron Hearts arrived 3 days ago',
          'Terminal Success with Hope: Also learn Whispers arrived 18 hours later',
          'ARIA-7: Can be befriended with compliments or reprogrammed DC 14'
        ],
        tips: 'This is the combat tutorial. Walk through the Duality Dice step by step.'
      }
    },
    { 
      id: 4, 
      name: 'Scene 4: Shadows', 
      location: 'Residential Zone', 
      notes: 'Meet Brix. DC 14 Presence to convince. DC 16 Instinct spots Silk.',
      details: {
        atmosphere: 'The residential sector is a ghost town. Tables set for diners who never arrived. A half-finished game on a datapad. Thick, expectant silence.',
        objectives: ['Locate Alexei without alerting assassins', 'Make contact with Iron Hearts', 'Detect the Whispers'],
        keyRolls: [
          'Presence + Persuasion DC 14: Convince Brix you\'re not enemies',
          'Presence + Deception DC 15: Alternative approach with Brix',
          'Instinct + Perception DC 16: Spot Madame Silk\'s camouflage'
        ],
        npcsPresent: ['Brix', 'Madame Silk (hidden)'],
        possibleOutcomes: [
          'Convince Brix: He leads you to Zara and Alexei',
          'Fail with Brix: He attacks or flees, alerts Iron Hearts',
          'Spot Silk with Fear: She knows your position now'
        ],
        tips: 'Brix is confused by human customs. Play up his literal interpretations for humor.'
      }
    },
    { 
      id: 5, 
      name: 'Scene 5: Broken Heart', 
      location: 'Engine Room', 
      notes: 'Meet Zara & Alexei. Betrayal Clock active. DC 15 Instinct detects traitors.',
      details: {
        atmosphere: 'Hot air, ozone smell. Makeshift barricades of supply crates. Zara aims her pistol with exhaustion, not hostility. Alexei watches with poetic hope.',
        objectives: ['Learn the truth about the "kidnapping"', 'Decide who to help', 'Watch for betrayal'],
        keyRolls: [
          'Instinct + Perception DC 15: Notice Korren and Thex exchanging looks',
          'Presence + Diplomacy DC 18: Negotiate a third way (very hard)'
        ],
        npcsPresent: ['Zara', 'Alexei', 'Brix', 'Korren', 'Thex'],
        possibleOutcomes: [
          'Option A: Uphold contract, take Alexei by force',
          'Option B: Help the lovers escape',
          'Option C: Find compromise (DC 18)',
          'Betrayal Clock fills: Korren acts at worst moment'
        ],
        tips: 'Use the Betrayal Clock. Advance when players ignore Korren, remove segment if they show empathy.'
      }
    },
    { 
      id: 6, 
      name: 'Scene 6: Betrayal', 
      location: 'Engine Room', 
      notes: 'Three-way fight! Korren betrays. Silk attacks. Weavers arrive.',
      details: {
        atmosphere: '"It\'s over, Zara! The money is real!" Korren\'s voice cracks. Lights die. Crystalline figures emerge. Hungry chirps from the vents.',
        objectives: ['Survive the three-way battle', 'Protect or capture Alexei', 'Escape before reactor overloads'],
        keyRolls: [
          'Combat against multiple factions',
          'Core Overload Clock: Mark segment when heavy weapon misses or hits console'
        ],
        npcsPresent: ['Zara', 'Alexei', 'Brix', 'Korren', 'Thex', 'Madame Silk', 'Scalpel', '4-5 Weavers'],
        possibleOutcomes: [
          'Korren can be talked down or killed',
          'Silk prioritizes contract over revenge',
          'Weavers attack nearest targets indiscriminately',
          'Core Overload Clock fills: Triggers Scene 7'
        ],
        tips: 'This is chaos. Let factions fight each other. Thex makes dramatic pronouncements nobody listens to.'
      }
    },
    { 
      id: 7, 
      name: 'Scene 7: Desperate Escape', 
      location: 'Corridors', 
      notes: 'Chase scene. Collapse Clock + Swarm Clock. Final dilemma.',
      details: {
        atmosphere: 'Alarms howl. Floor trembles. Emergency lights paint everything in blood. Behind you, an ocean of Weavers. Ahead, fire and closing blast doors.',
        objectives: ['Reach the ship before station collapses', 'Navigate obstacles', 'Make the final choice'],
        keyRolls: [
          'The Fire: Strength + Athletics DC 14 OR Knowledge + Tech DC 15',
          'Blast Doors: Finesse + Tech DC 16 OR Strength DC 18',
          'Save Survivor: Strength + Power DC 17 (advances BOTH clocks)'
        ],
        npcsPresent: ['Survivors from Scene 6', 'ARIA-7 (if befriended)'],
        possibleOutcomes: [
          'Structural Collapse Clock (6 segments): Station disintegrates',
          'Swarm Clock (4 segments): Face full Weaver Swarm',
          'Save survivor: Moral victory but costs time',
          'ARIA-7 sacrifice: "TELL... MY MOPS... I LOVED THEM..."'
        ],
        tips: 'Display clocks openly. Build tension. ARIA-7\'s sacrifice should be emotional.'
      }
    },
    { 
      id: 8, 
      name: 'Scene 8: Resolution', 
      location: 'Ship Cockpit', 
      notes: 'Report to Maya. Determine reputation changes. Hooks for future.',
      details: {
        atmosphere: 'Charon\'s Refuge burns in the rearview. Silence. The cost of survival hangs heavy. Did you do the right thing?',
        objectives: ['Report to Maya', 'Receive payment (or not)', 'Set up future hooks'],
        keyRolls: ['No rolls required - this is resolution'],
        npcsPresent: ['Maya Santos (via comms)', 'Surviving NPCs'],
        possibleOutcomes: [
          'Alexei to Amaranth: Full bonus (15 credits), +1 Amaranth, -1 Joric, -1 Valerius',
          'Alexei escaped: Partial pay (5 credits), -1 multiple houses, +1 Independent',
          'Alexei dead: No bonus, -2 all houses, Maya furious',
          'Zara survived: Becomes ally, future ship available',
          'Silk survived: Job offer and veiled threat'
        ],
        tips: 'Maya nods at whatever happened. "I have seen worse ideas." Let consequences sink in.'
      }
    }
  ],
  
  // Dice roller state
  diceRoller: {
    modifier: 0,
    advantage: 'normal', // 'normal', 'advantage', 'disadvantage'
    difficulty: 15,
    results: null,
    rollHistory: []
  },
  
  // Keeper moves data
  softMoves: [
    { name: 'Show a Threat', desc: 'Reveal danger without harm' },
    { name: 'Reveal Unwelcome Truth', desc: 'Expose hidden information' },
    { name: 'Ominous Warning', desc: 'Strange sounds, flickering lights' },
    { name: 'Offer Opportunity', desc: 'Present a choice with cost' }
  ],
  
  hardMoves: [
    { name: 'Inflict Harm', cost: 1, desc: 'Deal damage directly' },
    { name: 'Cause Malfunction', cost: 1, desc: 'Equipment fails' },
    { name: 'Separate Party', cost: 2, desc: 'Split the characters' },
    { name: 'Create Problem', cost: 2, desc: 'New immediate threat' },
    { name: 'Use Ability', cost: 1, desc: 'Antagonist special power' },
    { name: 'Reinforce', cost: 2, desc: 'Enemies arrive' }
  ],
  
  devastatingMoves: [
    { name: 'Betrayal Revealed', cost: 4, desc: 'Ally turns enemy' },
    { name: 'Secret Unleashed', cost: 4, desc: 'Major plot twist' },
    { name: 'Catastrophe', cost: 5, desc: 'Environmental disaster' },
    { name: 'Boss Phase 2', cost: 4, desc: 'Enemy transforms' }
  ]
};

// ==================== UTILITY FUNCTIONS ====================
const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function spendFear(amount) {
  if (state.fearTokens >= amount) {
    state.fearTokens -= amount;
    updateFearDisplay();
    return true;
  }
  return false;
}

function updateFearDisplay() {
  const fearCount = $('#fearCount');
  fearCount.textContent = `${state.fearTokens}/12`;
  fearCount.classList.toggle('max', state.fearTokens >= 12);
  
  // Also update save tab
  const saveFear = $('#saveFearTokens');
  if (saveFear) saveFear.textContent = `${state.fearTokens}/12`;
}

// ==================== CLOCK RENDERING ====================
function renderClockSVG(segments, filled, size = 100) {
  const segmentAngles = Array.from({ length: segments }, (_, i) => (360 / segments) * i - 90);
  
  let svg = `<svg viewBox="0 0 100 100" class="w-full h-full">`;
  svg += `<circle cx="50" cy="50" r="45" fill="none" stroke="#374151" stroke-width="3" />`;
  
  // Draw segment lines
  segmentAngles.forEach((angle) => {
    const rad = (angle * Math.PI) / 180;
    const x2 = 50 + 45 * Math.cos(rad);
    const y2 = 50 + 45 * Math.sin(rad);
    svg += `<line x1="50" y1="50" x2="${x2}" y2="${y2}" stroke="#374151" stroke-width="2" />`;
  });
  
  // Draw filled segments
  for (let i = 0; i < filled; i++) {
    const startAngle = (360 / segments) * i - 90;
    const endAngle = (360 / segments) * (i + 1) - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = 50 + 45 * Math.cos(startRad);
    const y1 = 50 + 45 * Math.sin(startRad);
    const x2 = 50 + 45 * Math.cos(endRad);
    const y2 = 50 + 45 * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const fillColor = filled === segments ? '#ef4444' : '#9333ea';
    svg += `<path d="M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${fillColor}" opacity="0.9" />`;
  }
  
  // Center number
  svg += `<text x="50" y="58" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${filled}</text>`;
  svg += `</svg>`;
  
  return svg;
}

function renderClock(clock, compact = false, showDelete = true) {
  const isHidden = clock.hidden && !state.keeperMode;
  if (isHidden) return '';
  
  return `
    <div class="clock-container ${compact ? 'compact' : ''}" data-clock-id="${clock.id}">
      ${clock.hidden ? '<span class="clock-hidden-indicator">👁</span>' : ''}
      <div class="clock-name">${escapeHtml(clock.name)}</div>
      <div class="clock-svg-container ${compact ? 'compact' : ''}">
        ${renderClockSVG(clock.segments, clock.filled)}
      </div>
      <div class="clock-controls">
        <button class="clock-btn" onclick="updateClock(${clock.id}, -1)" title="Decrease">−</button>
        <button class="clock-btn reset" onclick="resetClock(${clock.id})" title="Reset">↺</button>
        <button class="clock-btn" onclick="updateClock(${clock.id}, 1)" title="Increase">+</button>
      </div>
      ${state.keeperMode && showDelete && !compact ? `<button class="clock-delete" onclick="deleteClock(${clock.id})">✕ Delete</button>` : ''}
    </div>
  `;
}

function updateClock(id, delta) {
  const clock = state.clocks.find(c => c.id === id);
  if (clock) {
    clock.filled = Math.max(0, Math.min(clock.segments, clock.filled + delta));
    renderDashboard();
    renderClocksTab();
  }
}

function resetClock(id) {
  const clock = state.clocks.find(c => c.id === id);
  if (clock) {
    clock.filled = 0;
    renderDashboard();
    renderClocksTab();
  }
}

function deleteClock(id) {
  state.clocks = state.clocks.filter(c => c.id !== id);
  renderDashboard();
  renderClocksTab();
}

function addClock() {
  const nameInput = $('#newClockName');
  const segmentsSelect = $('#newClockSegments');
  
  const name = nameInput.value.trim();
  if (!name) return;
  
  const newClock = {
    id: Date.now(),
    name: name,
    segments: parseInt(segmentsSelect.value),
    filled: 0,
    hidden: false
  };
  
  state.clocks.push(newClock);
  nameInput.value = '';
  renderDashboard();
  renderClocksTab();
}

// ==================== CHARACTER CARD RENDERING ====================
function renderArmorSlots(char, compact = false) {
  const slots = char.armorSlots || 4;
  const marked = char.armorMarked || [];
  
  let html = '';
  for (let i = 0; i < slots; i++) {
    const isMarked = marked.includes(i);
    const slotClass = compact ? 'dashboard-armor-slot' : 'armor-slot';
    html += `<button class="${slotClass} ${isMarked ? 'used' : 'active'}" 
      onclick="event.stopPropagation(); toggleArmorSlot('${char.id}', ${i}, '${char.type || 'player'}')"
      title="Armor slot ${i + 1}${isMarked ? ' (damaged)' : ''}"></button>`;
  }
  return html;
}

function toggleArmorSlot(charId, slotIndex, type) {
  let charList;
  if (type === 'player') charList = state.players;
  else if (type === 'npc') charList = state.npcs;
  else charList = state.monsters;
  
  const char = charList.find(c => c.id == charId);
  if (!char) return;
  
  const currentMarked = [...(char.armorMarked || [])];
  const totalSlots = char.armorSlots || 4;
  const isMarked = currentMarked.includes(slotIndex);
  
  if (isMarked) {
    // Refill from lowest marked slot
    const sortedMarked = [...currentMarked].sort((a, b) => a - b);
    if (sortedMarked.length > 0) {
      const firstMarked = sortedMarked[0];
      currentMarked.splice(currentMarked.indexOf(firstMarked), 1);
    }
  } else {
    // Expend from last slot
    for (let slot = totalSlots - 1; slot >= 0; slot--) {
      if (!currentMarked.includes(slot)) {
        currentMarked.push(slot);
        break;
      }
    }
  }
  
  char.armorMarked = currentMarked;
  renderAll();
}

function updateCharStat(charId, type, stat, delta) {
  let charList;
  if (type === 'player') charList = state.players;
  else if (type === 'npc') charList = state.npcs;
  else charList = state.monsters;
  
  const char = charList.find(c => c.id == charId);
  if (!char) return;
  
  if (stat === 'hp') {
    char.hp = Math.max(0, Math.min(char.maxHp, char.hp + delta));
  } else if (stat === 'stress') {
    char.stress = Math.max(0, Math.min(char.maxStress, char.stress + delta));
  } else if (stat === 'hope') {
    const maxHope = type === 'player' ? 10 : 5;
    char.hope = Math.max(0, Math.min(maxHope, (char.hope || 0) + delta));
  }
  
  renderAll();
}

function getAbilityTypeIcon(type) {
  if (type === 'Reaction') return '<span class="ability-type-icon reaction">↩</span>';
  if (type === 'Passive') return '<span class="ability-type-icon passive">○</span>';
  return '<span class="ability-type-icon action">▶</span>';
}

function renderCharacterCard(char, isPlayer, isPinned = false) {
  const isHidden = char.hidden && !state.keeperMode;
  if (isHidden) return '';
  
  const isAlly = char.isAlly;
  const canHaveHope = isPlayer || isAlly;
  const cardClass = isPlayer ? 'player' : isAlly ? 'ally' : 'adversary';
  const charType = isPlayer ? 'player' : 'npc';
  
  // Add type property for armor slot handling
  char.type = charType;
  
  const expandedId = `char-expanded-${charType}-${char.id}`;
  
  let abilitiesHtml = '';
  if (char.abilities && char.abilities.length > 0) {
    abilitiesHtml = char.abilities.map((a, i) => {
      if (typeof a === 'string') {
        return `<div class="text-gray text-small">• ${escapeHtml(a)}</div>`;
      }
      const costType = isAlly ? 'Hope' : 'Fear';
      const costClass = isAlly ? 'hope' : 'fear';
      const costValue = a.cost || 0;
      
      // Check if this ability is being edited
      if (editingCharAbility && 
          editingCharAbility.charId == char.id && 
          editingCharAbility.charType === charType && 
          editingCharAbility.abilityIndex === i) {
        return `
          <div class="ability-edit-form">
            <input type="text" id="edit-ability-name-${charType}-${char.id}-${i}" value="${escapeHtml(a.name)}" placeholder="Name">
            <select id="edit-ability-type-${charType}-${char.id}-${i}">
              <option value="Action" ${a.type === 'Action' ? 'selected' : ''}>Action</option>
              <option value="Reaction" ${a.type === 'Reaction' ? 'selected' : ''}>Reaction</option>
              <option value="Passive" ${a.type === 'Passive' ? 'selected' : ''}>Passive</option>
            </select>
            <input type="number" id="edit-ability-cost-${charType}-${char.id}-${i}" value="${costValue}" min="0" max="10">
            <input type="text" id="edit-ability-desc-${charType}-${char.id}-${i}" value="${escapeHtml(a.desc)}" placeholder="Description">
            <button class="save" onclick="saveEditCharAbility(${char.id}, '${charType}', ${i})">✓</button>
            <button class="cancel" onclick="cancelEditCharAbility()">✕</button>
          </div>
        `;
      }
      
      return `
        <div class="ability-item">
          <span>
            ${getAbilityTypeIcon(a.type)}
            <span class="text-gray">${escapeHtml(a.name)}</span>
            <span class="ability-desc">(${escapeHtml(a.desc)})</span>
          </span>
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            ${costValue > 0 ? `<span class="ability-cost ${costClass}">${costValue} ${costType}</span>` : ''}
            ${state.keeperMode && !isPlayer ? `
              <button class="ability-edit-btn" onclick="startEditAbility(${char.id}, '${charType}', ${i})" title="Edit">✎</button>
              <button class="ability-delete" onclick="deleteAbility(${char.id}, ${i}, '${charType}')" title="Delete">✕</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  return `
    <div class="character-card ${cardClass} ${char.hidden ? 'hidden-char' : ''}" data-char-id="${char.id}">
      <div class="character-card-header">
        <div>
          <h4 class="character-name">
            ${escapeHtml(char.name)}
            ${isAlly && !isPlayer ? '<span class="ally-indicator">★ Ally</span>' : ''}
          </h4>
          ${char.subtitle ? `<p class="character-subtitle">${escapeHtml(char.subtitle)}</p>` : ''}
        </div>
        <div class="character-header-buttons">
          ${!isPlayer && state.keeperMode ? `
            <button class="ally-toggle-btn ${char.isAlly ? 'ally' : 'adversary'}" 
              onclick="toggleAllyStatus(${char.id})" 
              title="${char.isAlly ? 'Switch to Adversary' : 'Switch to Ally'}">
              ${char.isAlly ? '★' : '⚔'}
            </button>
          ` : ''}
          <button class="pin-btn ${isPinned ? 'pinned' : ''}" 
            onclick="toggleDashboardPin('${isPlayer ? 'players' : 'npcs'}', ${char.id})"
            title="${isPinned ? 'Remove from Dashboard' : 'Pin to Dashboard'}">📌</button>
          ${char.hidden ? '<span class="hidden-indicator">👁</span>' : ''}
          <button class="expand-btn" onclick="toggleCharExpand('${expandedId}')">▶</button>
        </div>
      </div>
      
      <div class="character-stats">
        <div class="stat-row">
          <span class="stat-label">HP:</span>
          <button class="stat-btn" onclick="updateCharStat(${char.id}, '${charType}', 'hp', -1)">−</button>
          <span class="${char.hp <= 0 ? 'stat-value critical' : ''}">${char.hp}/${char.maxHp}</span>
          <button class="stat-btn" onclick="updateCharStat(${char.id}, '${charType}', 'hp', 1)">+</button>
        </div>
        <div class="stat-row">
          <span class="stat-label stress">Stress:</span>
          <button class="stat-btn" onclick="updateCharStat(${char.id}, '${charType}', 'stress', -1)">−</button>
          <span class="${char.stress >= char.maxStress ? 'stat-value max-stress' : ''}">${char.stress}/${char.maxStress}</span>
          <button class="stat-btn" onclick="updateCharStat(${char.id}, '${charType}', 'stress', 1)">+</button>
        </div>
      </div>
      
      ${canHaveHope ? `
        <div class="stat-row" style="margin-bottom: 0.5rem;">
          <span class="stat-label hope">Hope:</span>
          <button class="stat-btn" onclick="updateCharStat(${char.id}, '${charType}', 'hope', -1)">−</button>
          <span class="${(char.hope || 0) >= (isPlayer ? 10 : 5) ? 'stat-value max-hope' : ''}">${char.hope || 0}/${isPlayer ? 10 : 5}</span>
          <button class="stat-btn" onclick="updateCharStat(${char.id}, '${charType}', 'hope', 1)">+</button>
        </div>
      ` : ''}
      
      <div class="armor-section">
        <div class="armor-header">
          <span class="text-gray">🛡 Armor: ${char.armor}</span>
          <span class="armor-thresholds">Minor ${char.armorMinor} / Severe ${char.armorSevere}</span>
        </div>
        <div class="armor-slots">
          ${renderArmorSlots(char)}
        </div>
      </div>
      
      <div class="evasion-row">
        Evasion: <span class="evasion-value">${char.evasion}</span>
      </div>
      
      <div id="${expandedId}" class="character-expanded hidden">
        ${char.description ? `<p class="character-description">${escapeHtml(char.description)}</p>` : ''}
        
        ${abilitiesHtml ? `
          <div class="abilities-section">
            <h5 class="abilities-title">Abilities:</h5>
            ${abilitiesHtml}
          </div>
        ` : ''}
        
        ${state.keeperMode && !isPlayer ? renderAddAbilityForm(char.id, charType, char.isAlly) : ''}
        
        ${char.equipment ? `
          <div class="equipment-section">
            <h5 class="equipment-title">Equipment:</h5>
            <p class="equipment-text">${escapeHtml(char.equipment)}</p>
          </div>
        ` : ''}
        
        ${state.keeperMode && char.keeperNotes ? `
          <div class="keeper-notes-section">
            <h5 class="keeper-notes-title">Keeper Notes:</h5>
            <p class="keeper-notes-text">${escapeHtml(char.keeperNotes)}</p>
          </div>
        ` : ''}
      </div>
      
      ${state.keeperMode ? `
        <div class="quick-note-section">
          <button class="quick-note-btn" onclick="toggleQuickNote('${charType}-${char.id}')">
            📝 Quick Note
            ${char.quickNote ? '<span class="quick-note-indicator">•</span>' : ''}
          </button>
          <div id="quick-note-${charType}-${char.id}" class="hidden">
            <textarea class="quick-note-textarea" 
              placeholder="Add a quick note about this character..."
              onchange="updateQuickNote(${char.id}, '${charType}', this.value)">${char.quickNote || ''}</textarea>
          </div>
          ${char.quickNote ? `<p class="quick-note-preview">${escapeHtml(char.quickNote)}</p>` : ''}
        </div>
        <div class="char-action-buttons">
          <button class="edit-char-btn" onclick="showEditCharacterModal('${charType}', ${char.id})">✏️ Edit</button>
          <button class="delete-char-btn" onclick="deleteCharacter(${char.id}, '${charType}')">🗑️ Delete</button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderAddAbilityForm(charId, charType, isAlly = false) {
  const costLabel = charType === 'monster' ? 'Fear' : (isAlly ? 'Hope' : 'Fear');
  const costClass = charType === 'monster' ? 'fear' : (isAlly ? 'hope' : 'fear');
  
  return `
    <div class="add-ability-form">
      <div class="text-small text-gray mb-2">Add Ability: <span class="cost-type-label ${costClass}">(Cost: ${costLabel})</span></div>
      <div class="form-row">
        <input type="text" placeholder="Name" id="ability-name-${charType}-${charId}">
        <select id="ability-type-${charType}-${charId}">
          <option value="Action">Action</option>
          <option value="Reaction">Reaction</option>
          <option value="Passive">Passive</option>
        </select>
        <input type="number" placeholder="Cost" id="ability-cost-${charType}-${charId}" min="0" max="10" value="0">
        <input type="text" placeholder="Description" id="ability-desc-${charType}-${charId}">
        <button class="add-ability-btn" onclick="addAbility(${charId}, '${charType}')">+</button>
      </div>
    </div>
  `;
}

function addAbility(charId, charType) {
  const nameEl = $(`#ability-name-${charType}-${charId}`);
  const typeEl = $(`#ability-type-${charType}-${charId}`);
  const costEl = $(`#ability-cost-${charType}-${charId}`);
  const descEl = $(`#ability-desc-${charType}-${charId}`);
  
  if (!nameEl.value.trim()) return;
  
  const charList = charType === 'player' ? state.players : charType === 'npc' ? state.npcs : state.monsters;
  const char = charList.find(c => c.id == charId);
  if (!char) return;
  
  const costValue = parseInt(costEl.value) || 0;
  
  const newAbility = {
    name: nameEl.value.trim(),
    type: typeEl.value,
    desc: descEl.value.trim() || 'No description'
  };
  
  // Use fearCost for monsters, cost for NPCs
  if (charType === 'monster') {
    newAbility.fearCost = costValue;
  } else {
    newAbility.cost = costValue;
  }
  
  if (!char.abilities) char.abilities = [];
  char.abilities.push(newAbility);
  
  nameEl.value = '';
  costEl.value = '0';
  descEl.value = '';
  
  renderAll();
}

function deleteAbility(charId, abilityIndex, charType) {
  const charList = charType === 'player' ? state.players : charType === 'npc' ? state.npcs : state.monsters;
  const char = charList.find(c => c.id == charId);
  if (!char || !char.abilities) return;
  
  char.abilities.splice(abilityIndex, 1);
  renderAll();
}

// Track which ability is being edited inline
let editingCharAbility = null; // { charId, charType, abilityIndex }

function startEditAbility(charId, charType, abilityIndex) {
  editingCharAbility = { charId, charType, abilityIndex };
  renderAll();
}

function cancelEditCharAbility() {
  editingCharAbility = null;
  renderAll();
}

function saveEditCharAbility(charId, charType, abilityIndex) {
  const charList = charType === 'player' ? state.players : charType === 'npc' ? state.npcs : state.monsters;
  const char = charList.find(c => c.id == charId);
  if (!char || !char.abilities) return;
  
  const nameEl = $(`#edit-ability-name-${charType}-${charId}-${abilityIndex}`);
  const typeEl = $(`#edit-ability-type-${charType}-${charId}-${abilityIndex}`);
  const costEl = $(`#edit-ability-cost-${charType}-${charId}-${abilityIndex}`);
  const descEl = $(`#edit-ability-desc-${charType}-${charId}-${abilityIndex}`);
  
  if (!nameEl || !nameEl.value.trim()) {
    alert('Please enter an ability name');
    return;
  }
  
  const costValue = parseInt(costEl?.value) || 0;
  
  char.abilities[abilityIndex] = {
    name: nameEl.value.trim(),
    type: typeEl?.value || 'Action',
    desc: descEl?.value.trim() || 'No description'
  };
  
  // Use fearCost for monsters, cost for NPCs
  if (charType === 'monster') {
    char.abilities[abilityIndex].fearCost = costValue;
  } else {
    char.abilities[abilityIndex].cost = costValue;
  }
  
  editingCharAbility = null;
  renderAll();
}

function toggleCharExpand(expandedId) {
  const el = $(`#${expandedId}`);
  if (el) {
    el.classList.toggle('hidden');
    // Update button text
    const btn = el.previousElementSibling?.querySelector('.expand-btn') || 
                el.parentElement.querySelector('.expand-btn');
    if (btn) {
      btn.textContent = el.classList.contains('hidden') ? '▶' : '▼';
    }
  }
}

function toggleQuickNote(id) {
  const el = $(`#quick-note-${id}`);
  if (el) el.classList.toggle('hidden');
}

function updateQuickNote(charId, charType, value) {
  const charList = charType === 'player' ? state.players : charType === 'npc' ? state.npcs : state.monsters;
  const char = charList.find(c => c.id == charId);
  if (char) {
    char.quickNote = value;
  }
}

function toggleAllyStatus(npcId) {
  const npc = state.npcs.find(n => n.id == npcId);
  if (npc) {
    npc.isAlly = !npc.isAlly;
    renderAll();
  }
}

function deleteCharacter(charId, charType) {
  if (charType === 'player') {
    state.players = state.players.filter(p => p.id != charId);
    state.dashboardPins.players = state.dashboardPins.players.filter(id => id != charId);
  } else if (charType === 'npc') {
    state.npcs = state.npcs.filter(n => n.id != charId);
    state.dashboardPins.npcs = state.dashboardPins.npcs.filter(id => id != charId);
  } else {
    state.monsters = state.monsters.filter(m => m.id != charId);
    state.dashboardPins.monsters = state.dashboardPins.monsters.filter(id => id != charId);
  }
  renderAll();
}

function toggleDashboardPin(type, id) {
  const pins = state.dashboardPins[type];
  const index = pins.indexOf(id);
  if (index > -1) {
    pins.splice(index, 1);
  } else {
    pins.push(id);
  }
  renderAll();
}

// Continue in next part...


// ==================== DASHBOARD CHARACTER CARD ====================
function renderDashboardCharCard(char, type) {
  const isPlayer = type === 'player';
  const isAlly = char.isAlly;
  const canHaveHope = isPlayer || isAlly;
  const isHidden = char.hidden && !state.keeperMode;
  if (isHidden) return '';
  
  const cardClass = isPlayer ? 'player' : isAlly ? 'ally' : type === 'monster' ? 'monster' : 'adversary';
  const isSpotlight = state.spotlightFocus?.type === type && state.spotlightFocus?.id === char.id;
  
  char.type = type;
  
  return `
    <div class="dashboard-char-card ${cardClass} ${isSpotlight ? 'spotlight' : ''}" 
         onclick="handleSpotlightClick('${type}', ${char.id}, ${isAlly || false})"
         data-char-id="${char.id}">
      ${isSpotlight ? '<div class="spotlight-indicator">🔦</div>' : ''}
      
      <div class="dashboard-card-header">
        <div class="dashboard-card-name">
          ${escapeHtml(char.name)}
          ${isAlly && !isPlayer ? '<span class="ally-indicator">★</span>' : ''}
        </div>
        <div class="dashboard-card-buttons">
          ${char.hidden ? '<span class="hidden-indicator">👁</span>' : ''}
          <button class="unpin-btn" onclick="event.stopPropagation(); toggleDashboardPin('${type === 'player' ? 'players' : type === 'npc' ? 'npcs' : 'monsters'}', ${char.id})" title="Unpin">✕</button>
        </div>
      </div>
      
      <div class="dashboard-stats-row">
        <!-- HP -->
        <div class="dashboard-stat">
          <div class="dashboard-stat-header">
            <span class="dashboard-stat-icon hp">❤</span>
            <span class="dashboard-stat-value ${char.hp <= 0 ? 'critical' : ''}">${char.hp}/${char.maxHp}</span>
          </div>
          <div class="dashboard-stat-buttons">
            <button class="dashboard-stat-btn minus" onclick="event.stopPropagation(); updateCharStat(${char.id}, '${type}', 'hp', -1)">−</button>
            <button class="dashboard-stat-btn plus" onclick="event.stopPropagation(); updateCharStat(${char.id}, '${type}', 'hp', 1)">+</button>
          </div>
        </div>
        
        <!-- Stress -->
        <div class="dashboard-stat">
          <div class="dashboard-stat-header">
            <span class="dashboard-stat-icon stress">⚡</span>
            <span class="dashboard-stat-value ${char.stress >= char.maxStress ? 'max' : ''}">${char.stress}/${char.maxStress}</span>
          </div>
          <div class="dashboard-stat-buttons">
            <button class="dashboard-stat-btn neutral" onclick="event.stopPropagation(); updateCharStat(${char.id}, '${type}', 'stress', -1)">−</button>
            <button class="dashboard-stat-btn neutral" onclick="event.stopPropagation(); updateCharStat(${char.id}, '${type}', 'stress', 1)">+</button>
          </div>
        </div>
        
        ${canHaveHope ? `
          <!-- Hope -->
          <div class="dashboard-stat">
            <div class="dashboard-stat-header">
              <span class="dashboard-stat-icon hope">✦</span>
              <span class="dashboard-stat-value ${(char.hope || 0) >= (isPlayer ? 10 : 5) ? 'max' : ''}">${char.hope || 0}/${isPlayer ? 10 : 5}</span>
            </div>
            <div class="dashboard-stat-buttons">
              <button class="dashboard-stat-btn neutral" onclick="event.stopPropagation(); updateCharStat(${char.id}, '${type}', 'hope', -1)">−</button>
              <button class="dashboard-stat-btn neutral" onclick="event.stopPropagation(); updateCharStat(${char.id}, '${type}', 'hope', 1)">+</button>
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- Armor & Evasion -->
      <div class="dashboard-armor-row">
        <span class="dashboard-armor-icon">🛡</span>
        <div class="dashboard-armor-slots">
          ${renderArmorSlots(char, true)}
        </div>
        <span class="text-gray">|</span>
        <span class="dashboard-evasion">Ev:<span class="dashboard-evasion-value">${char.evasion}</span></span>
      </div>
      
      <!-- Armor Thresholds -->
      <div class="dashboard-armor-thresholds">
        <span>Armor: <span class="armor-value">${char.armor}</span></span>
        <span>Minor: <span class="minor-value">${char.armorMinor}</span></span>
        <span>Severe: <span class="severe-value">${char.armorSevere}</span></span>
      </div>
      
      ${state.keeperMode ? `
        <div class="dashboard-quick-note">
          <button class="quick-note-btn" onclick="event.stopPropagation(); toggleQuickNote('dash-${type}-${char.id}')">
            📝 ${char.quickNote ? `<span class="text-yellow truncate" style="max-width: 80px;">${escapeHtml(char.quickNote.substring(0, 20))}</span>` : 'Note'}
          </button>
          <div id="quick-note-dash-${type}-${char.id}" class="hidden">
            <textarea class="quick-note-textarea" 
              onclick="event.stopPropagation()"
              placeholder="Quick note..."
              onchange="updateQuickNote(${char.id}, '${type}', this.value)">${char.quickNote || ''}</textarea>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function handleSpotlightClick(type, id, isAlly) {
  if (type === 'player') {
    state.spotlightFocus = { type, id };
  } else if (type === 'npc' && isAlly) {
    const npc = state.npcs.find(n => n.id === id);
    if (npc && (npc.hope || 0) >= 1) {
      npc.hope = (npc.hope || 0) - 1;
      state.spotlightFocus = { type, id };
    }
  } else {
    if (spendFear(1)) {
      state.spotlightFocus = { type, id };
    }
  }
  renderAll();
}

// ==================== SCENE RENDERING ====================
function renderSceneDetail(scene) {
  const expandedId = `scene-expanded-${scene.id}`;
  
  // Build environment display for dashboard (now inside collapsible section)
  let envHtml = '';
  if (scene.environment && (scene.environment.macro || scene.environment.micro)) {
    const macro = scene.environment.macro ? MACRO_ENVIRONMENTS.find(e => e.id === scene.environment.macro) : null;
    const micro = scene.environment.micro ? MICRO_ENVIRONMENTS.find(e => e.id === scene.environment.micro) : null;
    
    envHtml = '<div class="dashboard-env-section">';
    envHtml += '<h5>🌍 Active Environment</h5>';
    
    if (macro) {
      const macroTier = scene.environment.macroTier ? macro.tierScaling?.find(t => t.tier === scene.environment.macroTier) : null;
      envHtml += `
        <div class="dashboard-env-card macro">
          <div class="dash-env-header">
            <span class="env-type-badge macro">MACRO</span>
            <strong>${escapeHtml(macro.name)}</strong>
          </div>
          <div class="dash-env-meta">
            ${macroTier ? `Tier ${macroTier.tier}: ${escapeHtml(macroTier.name)} • ` : ''}
            DC ${scene.environment.macroDC || macroTier?.difficulty || '?'} • ${escapeHtml(macro.type)}
          </div>
          ${macroTier ? `<div class="dash-env-tier-desc">${escapeHtml(macroTier.desc)}</div>` : ''}
          <div class="dash-env-features">
            ${macro.features.map(f => `
              <div class="dash-env-feature tooltip-trigger" data-tooltip="${escapeHtml(f.desc)}">
                <span class="feature-tag ${f.type.toLowerCase()}">${f.type}</span>
                <strong>${escapeHtml(f.name)}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (micro) {
      const microTier = scene.environment.microTier ? micro.tierScaling?.find(t => t.tier === scene.environment.microTier) : null;
      envHtml += `
        <div class="dashboard-env-card micro">
          <div class="dash-env-header">
            <span class="env-type-badge micro">MICRO</span>
            <strong>${escapeHtml(micro.name)}</strong>
          </div>
          <div class="dash-env-meta">
            ${microTier ? `Tier ${microTier.tier}: ${escapeHtml(microTier.name)} • ` : ''}
            DC ${scene.environment.microDC || microTier?.difficulty || '?'} • ${escapeHtml(micro.type)}
          </div>
          ${microTier ? `<div class="dash-env-tier-desc">${escapeHtml(microTier.desc)}</div>` : ''}
          <div class="dash-env-features">
            ${micro.features.map(f => `
              <div class="dash-env-feature tooltip-trigger" data-tooltip="${escapeHtml(f.desc)}">
                <span class="feature-tag ${f.type.toLowerCase()}">${f.type}</span>
                <strong>${escapeHtml(f.name)}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (scene.environment.modifier) {
      envHtml += `<div class="dash-env-modifier">⚡ <strong>Active:</strong> ${escapeHtml(scene.environment.modifier)}</div>`;
    }
    
    envHtml += '</div>';
  }
  
  return `
    <div class="scene-detail">
      <div class="scene-detail-header">
        <div class="scene-detail-title" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <h4>${escapeHtml(scene.name)}</h4>
              <span class="scene-detail-location">📍 ${escapeHtml(scene.location)}</span>
            </div>
            ${state.keeperMode && scene.notes ? `<p class="scene-detail-notes">${escapeHtml(scene.notes)}</p>` : ''}
          </div>
          <button class="scene-expand-btn" onclick="toggleSceneExpand('${expandedId}', this)">▶ Details</button>
        </div>
      </div>
      
      <div id="${expandedId}" class="scene-expanded hidden">
        ${envHtml}
        
        ${scene.details ? `
          ${scene.details.atmosphere ? `
            <div class="scene-section">
              <h5>🌌 Atmosphere</h5>
              <p class="scene-atmosphere">"${escapeHtml(scene.details.atmosphere)}"</p>
            </div>
          ` : ''}
          
          ${scene.details.objectives && scene.details.objectives.length > 0 ? `
            <div class="scene-section">
              <h5>🎯 Objectives</h5>
              <ul class="scene-objectives">
                ${scene.details.objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${state.keeperMode && scene.details.keyRolls && scene.details.keyRolls.length > 0 ? `
            <div class="scene-section">
              <h5>🎲 Key Rolls</h5>
              <div class="scene-key-rolls">
                ${scene.details.keyRolls.map(roll => `<p>${escapeHtml(roll)}</p>`).join('')}
              </div>
            </div>
          ` : ''}
          
          ${scene.details.npcsPresent && scene.details.npcsPresent.length > 0 ? `
            <div class="scene-section">
              <h5>👥 NPCs Present</h5>
              <div class="scene-npcs">
                ${scene.details.npcsPresent.map(npc => `<span class="scene-npc-tag">${escapeHtml(npc)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          ${state.keeperMode && scene.details.possibleOutcomes && scene.details.possibleOutcomes.length > 0 ? `
            <div class="scene-section">
              <h5>📊 Possible Outcomes</h5>
              <ul class="scene-outcomes">
                ${scene.details.possibleOutcomes.map(outcome => `<li>${escapeHtml(outcome)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${state.keeperMode && scene.details.tips ? `
            <div class="scene-section">
              <h5>💡 Keeper Tips</h5>
              <p class="scene-tips">${escapeHtml(scene.details.tips)}</p>
            </div>
          ` : ''}
        ` : ''}
      </div>
    </div>
  `;
}

function toggleSceneExpand(expandedId, btn) {
  const el = $(`#${expandedId}`);
  if (el) {
    el.classList.toggle('hidden');
    btn.textContent = el.classList.contains('hidden') ? '▶ More' : '▼ Less';
  }
}

// ==================== DICE ROLLER ====================
function renderDiceRoller(containerId) {
  const dr = state.diceRoller;
  const difficultyScale = [
    { dc: 5, label: 'Trivial (5)' },
    { dc: 10, label: 'Easy (10)' },
    { dc: 15, label: 'Standard (15)' },
    { dc: 20, label: 'Hard (20)' },
    { dc: 25, label: 'Almost Impossible (25)' }
  ];
  
  const currentDiffLabel = difficultyScale.find(d => d.dc === dr.difficulty)?.label || `Custom (${dr.difficulty})`;
  
  let html = `
    <div class="dice-roller">
      <h3 class="dice-roller-title">Dice Roller</h3>
      
      <!-- Difficulty Scale -->
      <div class="difficulty-section">
        <label class="difficulty-label">Difficulty Class (DC)</label>
        <div class="difficulty-buttons">
          ${difficultyScale.map(d => `
            <button class="difficulty-btn ${dr.difficulty === d.dc ? 'active' : ''}" 
              onclick="setDifficulty(${d.dc})">${d.dc}</button>
          `).join('')}
          <input type="number" class="difficulty-input" value="${dr.difficulty}" 
            onchange="setDifficulty(parseInt(this.value))" min="1">
        </div>
        <div class="difficulty-display">${currentDiffLabel}</div>
      </div>
      
      <!-- Modifier and Advantage -->
      <div class="modifier-section">
        <div class="modifier-controls">
          <span class="modifier-label">Mod:</span>
          <button class="modifier-btn" onclick="adjustModifier(-1)">−</button>
          <span class="modifier-value">${dr.modifier >= 0 ? '+' + dr.modifier : dr.modifier}</span>
          <button class="modifier-btn" onclick="adjustModifier(1)">+</button>
        </div>
        <div class="advantage-controls">
          <button class="advantage-btn advantage ${dr.advantage === 'advantage' ? 'active' : ''}" 
            onclick="toggleAdvantage('advantage')">+1d6</button>
          <button class="advantage-btn disadvantage ${dr.advantage === 'disadvantage' ? 'active' : ''}" 
            onclick="toggleAdvantage('disadvantage')">-1d6</button>
        </div>
      </div>
      
      <!-- Roll Buttons -->
      <div class="roll-buttons">
        <button class="roll-btn duality" onclick="rollDuality()">🎲 Duality (2d12)</button>
        <button class="roll-btn d20" onclick="rollD20()">🎲 Keeper d20</button>
      </div>
      
      <!-- Damage Dice -->
      <div class="damage-dice">
        ${['1d4', '1d6', '1d8', '1d10', '1d12', '2d6', '2d8', '3d6'].map(dice => `
          <button class="damage-btn" onclick="rollDamage('${dice}')">${dice}</button>
        `).join('')}
      </div>
      
      <!-- Result Display -->
      ${dr.results ? renderDiceResult(dr.results) : ''}
      
      <!-- Roll History -->
      ${dr.rollHistory.length > 0 ? `
        <div class="roll-history">
          <div class="roll-history-title">History</div>
          <div class="roll-history-list custom-scrollbar">
            ${dr.rollHistory.slice(0, 5).map(r => `
              <div class="roll-history-item">
                <span>${r.timestamp}</span>
                <span>
                  ${r.type === 'duality' ? `H:${r.hope} F:${r.fear} = ${r.total}` : ''}
                  ${r.type === 'd20' ? `d20: ${r.roll}${r.modifier ? ` (${r.total})` : ''}` : ''}
                  ${r.type === 'damage' ? `${r.dice}: ${r.total}` : ''}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  const container = $(`#${containerId}`);
  if (container) container.innerHTML = html;
}

function renderDiceResult(results) {
  if (results.type === 'duality') {
    return `
      <div class="roll-result">
        <div class="duality-result">
          <div class="duality-die">
            <div class="duality-die-label hope">Hope</div>
            <div class="duality-die-value ${results.hope > results.fear ? 'hope-high' : 'hope-low'}">${results.hope}</div>
          </div>
          <div class="duality-die">
            <div class="duality-die-label fear">Fear</div>
            <div class="duality-die-value ${results.fear > results.hope ? 'fear-high' : 'fear-low'}">${results.fear}</div>
          </div>
          ${results.advDie !== 0 ? `
            <div class="duality-die">
              <div class="duality-die-label ${results.advDie > 0 ? 'adv' : 'dis'}">${results.advDie > 0 ? 'Adv' : 'Dis'}</div>
              <div class="duality-die-value ${results.advDie > 0 ? 'adv-positive' : 'adv-negative'}">${results.advDie > 0 ? '+' + results.advDie : results.advDie}</div>
            </div>
          ` : ''}
        </div>
        
        <div class="roll-calculation">
          ${results.hope} + ${results.fear}
          ${results.advDie !== 0 ? ` ${results.advDie > 0 ? '+' : ''}${results.advDie}` : ''}
          ${results.modifier !== 0 ? ` ${results.modifier > 0 ? '+' : ''}${results.modifier}` : ''}
          = <span class="roll-total ${results.success ? 'success' : 'failure'}">${results.total}</span>
          <span class="roll-vs-dc"> vs DC ${results.difficulty}</span>
        </div>
        
        ${results.doubles ? '<div class="doubles-indicator">⚡ DOUBLES! (' + results.hope + ' = ' + results.fear + ')</div>' : ''}
        
        <div class="roll-outcome ${results.outcomeClass}">${results.outcome}</div>
        
        <div class="gain-indicators">
          ${results.gainHope ? '<span class="gain-hope">+1 Hope</span>' : ''}
          ${results.gainFear ? '<span class="gain-fear">+1 Fear Token</span>' : ''}
        </div>
      </div>
    `;
  } else if (results.type === 'd20') {
    return `
      <div class="roll-result">
        <div class="d20-result-value ${results.nat20 ? 'nat20' : results.nat1 ? 'nat1' : ''}">${results.roll}</div>
        ${results.modifier !== 0 ? `
          <div class="d20-modifier">${results.roll} + (${results.modifier}) = <span class="text-white font-bold">${results.total}</span></div>
        ` : ''}
        ${results.nat20 ? '<div class="d20-nat-indicator nat20">NAT 20!</div>' : ''}
        ${results.nat1 ? '<div class="d20-nat-indicator nat1">NAT 1!</div>' : ''}
      </div>
    `;
  } else if (results.type === 'damage') {
    return `
      <div class="roll-result">
        <div class="damage-result-dice">${results.dice}</div>
        <div class="damage-result-total">${results.total} dmg</div>
        <div class="damage-result-rolls">[${results.rolls.join(', ')}]${results.modifier !== 0 ? ` + (${results.modifier})` : ''}</div>
      </div>
    `;
  }
  return '';
}

function setDifficulty(dc) {
  state.diceRoller.difficulty = dc;
  renderDiceRoller('diceRoller');
  renderDiceRoller('fullDiceRoller');
}

function adjustModifier(delta) {
  state.diceRoller.modifier += delta;
  renderDiceRoller('diceRoller');
  renderDiceRoller('fullDiceRoller');
}

function toggleAdvantage(type) {
  if (state.diceRoller.advantage === type) {
    state.diceRoller.advantage = 'normal';
  } else {
    state.diceRoller.advantage = type;
  }
  renderDiceRoller('diceRoller');
  renderDiceRoller('fullDiceRoller');
}

function rollDuality() {
  const dr = state.diceRoller;
  let hopeRoll = rollDie(12);
  let fearRoll = rollDie(12);
  let advDie = 0;
  
  if (dr.advantage === 'advantage') {
    advDie = rollDie(6);
  } else if (dr.advantage === 'disadvantage') {
    advDie = -rollDie(6);
  }
  
  const total = hopeRoll + fearRoll + dr.modifier + advDie;
  const doubles = hopeRoll === fearRoll;
  const success = total >= dr.difficulty;
  const hopeWins = hopeRoll >= fearRoll;
  
  let outcome = '';
  let outcomeClass = '';
  let gainHope = false;
  let gainFear = false;
  
  if (doubles) {
    outcome = '🎯 CRITICAL SUCCESS!';
    outcomeClass = 'critical';
    gainHope = true;
  } else if (success) {
    if (hopeWins) {
      outcome = '✓ Success with Hope';
      outcomeClass = 'success-hope';
      gainHope = true;
    } else {
      outcome = '✓ Success with Fear';
      outcomeClass = 'success-fear';
      gainFear = true;
    }
  } else {
    if (hopeWins) {
      outcome = '✗ Failure with Hope';
      outcomeClass = 'failure-hope';
      gainHope = true;
    } else {
      outcome = '✗ Failure with Fear';
      outcomeClass = 'failure-fear';
      gainFear = true;
    }
  }
  
  // Auto-increment Fear counter
  if (gainFear) {
    state.fearTokens = Math.min(12, state.fearTokens + 1);
    updateFearDisplay();
  }
  
  // Auto-increment Hope for spotlighted player
  if (gainHope && state.spotlightFocus) {
    if (state.spotlightFocus.type === 'player') {
      const player = state.players.find(p => p.id === state.spotlightFocus.id);
      if (player) {
        player.hope = Math.min(10, (player.hope || 0) + 1);
      }
    } else if (state.spotlightFocus.type === 'npc') {
      const npc = state.npcs.find(n => n.id === state.spotlightFocus.id);
      if (npc?.isAlly) {
        npc.hope = Math.min(5, (npc.hope || 0) + 1);
      }
    }
  }
  
  const result = {
    type: 'duality',
    hope: hopeRoll,
    fear: fearRoll,
    advDie,
    modifier: dr.modifier,
    total,
    difficulty: dr.difficulty,
    success,
    outcome,
    outcomeClass,
    doubles,
    gainHope,
    gainFear,
    timestamp: new Date().toLocaleTimeString()
  };
  
  dr.results = result;
  dr.rollHistory.unshift(result);
  if (dr.rollHistory.length > 10) dr.rollHistory.pop();
  
  renderAll();
}

function rollD20() {
  const dr = state.diceRoller;
  let roll1 = rollDie(20);
  let roll2;
  
  if (dr.advantage !== 'normal') {
    roll2 = rollDie(20);
  }
  
  let finalRoll = roll1;
  if (dr.advantage === 'advantage') {
    finalRoll = Math.max(roll1, roll2 || 0);
  } else if (dr.advantage === 'disadvantage') {
    finalRoll = Math.min(roll1, roll2 || roll1);
  }
  
  const total = finalRoll + dr.modifier;
  
  const result = {
    type: 'd20',
    roll: finalRoll,
    modifier: dr.modifier,
    total,
    nat20: finalRoll === 20,
    nat1: finalRoll === 1,
    timestamp: new Date().toLocaleTimeString()
  };
  
  dr.results = result;
  dr.rollHistory.unshift(result);
  if (dr.rollHistory.length > 10) dr.rollHistory.pop();
  
  renderDiceRoller('diceRoller');
  renderDiceRoller('fullDiceRoller');
}

function rollDamage(dice) {
  const dr = state.diceRoller;
  const [count, sides] = dice.split('d').map(Number);
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + dr.modifier;
  
  const result = {
    type: 'damage',
    dice,
    rolls,
    modifier: dr.modifier,
    total,
    timestamp: new Date().toLocaleTimeString()
  };
  
  dr.results = result;
  dr.rollHistory.unshift(result);
  if (dr.rollHistory.length > 10) dr.rollHistory.pop();
  
  renderDiceRoller('diceRoller');
  renderDiceRoller('fullDiceRoller');
}

// Continue in next part...


// ==================== SPOTLIGHT & ABILITIES RENDERING ====================
function renderSpotlightSection() {
  let html = '';
  
  // Current spotlight display
  if (state.spotlightFocus) {
    let name = '';
    let typeLabel = '';
    
    if (state.spotlightFocus.type === 'player') {
      const player = state.players.find(p => p.id === state.spotlightFocus.id);
      name = player?.name || 'Unknown';
      typeLabel = 'Player';
    } else if (state.spotlightFocus.type === 'npc') {
      const npc = state.npcs.find(n => n.id === state.spotlightFocus.id);
      name = npc?.name || 'Unknown';
      typeLabel = npc?.isAlly ? 'Ally' : 'Adversary';
    } else {
      const monster = state.monsters.find(m => m.id === state.spotlightFocus.id);
      name = monster?.name || 'Unknown';
      typeLabel = 'Adversary';
    }
    
    html += `
      <div class="spotlight-active">
        <span class="spotlight-name">🔦 ${escapeHtml(name)}<span class="spotlight-type">(${typeLabel})</span></span>
        <button class="spotlight-clear-btn" onclick="clearSpotlight()">Clear</button>
      </div>
    `;
  } else {
    html += '<div class="spotlight-empty">Click a character card to give them the spotlight</div>';
  }
  
  $('#spotlightDisplay').innerHTML = html;
  
  // Spotlight buttons
  let buttonsHtml = '';
  
  // Players section
  const pinnedPlayers = state.players.filter(p => state.dashboardPins.players.includes(p.id));
  if (pinnedPlayers.length > 0) {
    buttonsHtml += `
      <div class="spotlight-section">
        <div class="spotlight-section-title players">Players (Free)</div>
        ${pinnedPlayers.map(p => {
          const isFocused = state.spotlightFocus?.type === 'player' && state.spotlightFocus?.id === p.id;
          return `
            <button class="spotlight-btn player ${isFocused ? 'active' : ''}" 
              onclick="setSpotlight('player', ${p.id})">
              ${isFocused ? '🔦 ' : ''}${escapeHtml(p.name)}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Allies section
  const pinnedAllies = state.npcs.filter(n => n.isAlly && state.dashboardPins.npcs.includes(n.id) && (!n.hidden || state.keeperMode));
  if (pinnedAllies.length > 0) {
    buttonsHtml += `
      <div class="spotlight-section">
        <div class="spotlight-section-title allies">Allies (1 Hope)</div>
        ${pinnedAllies.map(n => {
          const isFocused = state.spotlightFocus?.type === 'npc' && state.spotlightFocus?.id === n.id;
          const hasHope = (n.hope || 0) >= 1;
          return `
            <button class="spotlight-btn ally ${isFocused ? 'active' : ''}" 
              onclick="setSpotlight('npc', ${n.id}, true)"
              ${!isFocused && !hasHope ? 'disabled' : ''}>
              ${isFocused ? '🔦 ' : ''}★ ${escapeHtml(n.name)}
              <span class="spotlight-cost hope">✦${n.hope || 0}${!isFocused && hasHope ? ' −1' : ''}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Adversaries section
  const pinnedAdversaries = [
    ...state.npcs.filter(n => !n.isAlly && state.dashboardPins.npcs.includes(n.id) && (!n.hidden || state.keeperMode)),
    ...state.monsters.filter(m => state.dashboardPins.monsters.includes(m.id) && (!m.hidden || state.keeperMode))
  ];
  if (pinnedAdversaries.length > 0) {
    buttonsHtml += `
      <div class="spotlight-section">
        <div class="spotlight-section-title adversaries">Adversaries (1 Fear)</div>
        ${pinnedAdversaries.map(char => {
          const isNpc = state.npcs.some(n => n.id === char.id && !n.isAlly);
          const type = isNpc ? 'npc' : 'monster';
          const isFocused = state.spotlightFocus?.type === type && state.spotlightFocus?.id === char.id;
          return `
            <button class="spotlight-btn adversary ${isFocused ? 'active' : ''}" 
              onclick="setSpotlight('${type}', ${char.id})"
              ${!isFocused && state.fearTokens < 1 ? 'disabled' : ''}>
              ${isFocused ? '🔦 ' : ''}${escapeHtml(char.name)}
              ${!isFocused ? '<span class="spotlight-cost fear">−1</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }
  
  $('#spotlightButtons').innerHTML = buttonsHtml;
}

function setSpotlight(type, id, isAlly = false) {
  if (type === 'player') {
    state.spotlightFocus = { type, id };
  } else if (type === 'npc' && isAlly) {
    const npc = state.npcs.find(n => n.id === id);
    if (npc && (npc.hope || 0) >= 1) {
      npc.hope = (npc.hope || 0) - 1;
      state.spotlightFocus = { type, id };
    }
  } else {
    if (spendFear(1)) {
      state.spotlightFocus = { type, id };
    }
  }
  renderAll();
}

function clearSpotlight() {
  state.spotlightFocus = null;
  renderAll();
}

function renderAbilityButtons() {
  let html = '';
  
  // Tooltip area
  const tooltip = $('#abilityTooltip');
  if (state.hoveredAbility) {
    const a = state.hoveredAbility;
    tooltip.classList.add('active');
    tooltip.innerHTML = `
      <div class="ability-tooltip-name">${escapeHtml(a.name)}</div>
      <div class="ability-tooltip-info">
        <span class="ability-tooltip-type ${a.type?.toLowerCase() || 'action'}">${a.type || 'Action'}</span>
        ${(a.cost > 0 || a.fearCost > 0) ? `
          <span class="ability-tooltip-cost ${a.isAlly ? 'hope' : 'fear'}">
            • Cost: ${a.cost || a.fearCost} ${a.isAlly ? 'Hope' : 'Fear'}
          </span>
        ` : ''}
      </div>
      <div class="ability-tooltip-desc">${escapeHtml(a.desc)}</div>
    `;
  } else {
    tooltip.classList.remove('active');
    tooltip.innerHTML = '<span class="text-gray italic">Hover over an ability to see details</span>';
  }
  
  // Ally NPCs
  const pinnedAllies = state.npcs.filter(n => n.isAlly && state.dashboardPins.npcs.includes(n.id) && (!n.hidden || state.keeperMode) && n.abilities?.length > 0);
  pinnedAllies.forEach(npc => {
    html += `
      <div class="ability-buttons-container ally">
        <div class="ability-container-title ally">★ ${escapeHtml(npc.name)} <span class="text-cyan">(✦${npc.hope || 0})</span></div>
        ${npc.abilities.map((ability, i) => {
          const cost = ability.cost || 0;
          const canUse = cost === 0 || (npc.hope || 0) >= cost;
          return `
            <button class="ability-btn ${cost > 0 ? 'hope-cost' : 'free'}"
              onclick="useAllyAbility(${npc.id}, ${i})"
              onmouseenter="setHoveredAbility(${JSON.stringify(ability).replace(/"/g, '&quot;')}, true)"
              onmouseleave="clearHoveredAbility()"
              ${!canUse ? 'disabled' : ''}>
              <span>
                ${getAbilityTypeIcon(ability.type)} ${escapeHtml(ability.name)}
              </span>
              ${cost > 0 ? `<span class="ability-btn-cost hope">−${cost} ✦</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;
  });
  
  // Adversary NPCs
  const pinnedAdversaryNpcs = state.npcs.filter(n => !n.isAlly && state.dashboardPins.npcs.includes(n.id) && (!n.hidden || state.keeperMode) && n.abilities?.length > 0);
  pinnedAdversaryNpcs.forEach(npc => {
    html += `
      <div class="ability-buttons-container adversary">
        <div class="ability-container-title adversary">⚔ ${escapeHtml(npc.name)}</div>
        ${npc.abilities.map((ability, i) => {
          const cost = ability.cost || 0;
          return `
            <button class="ability-btn ${cost > 0 ? 'fear-cost' : 'free'}"
              onclick="useNpcAbility(${npc.id}, ${i})"
              onmouseenter="setHoveredAbility(${JSON.stringify(ability).replace(/"/g, '&quot;')}, false)"
              onmouseleave="clearHoveredAbility()"
              ${cost > state.fearTokens ? 'disabled' : ''}>
              <span>
                ${getAbilityTypeIcon(ability.type)} ${escapeHtml(ability.name)}
              </span>
              ${cost > 0 ? `<span class="ability-btn-cost fear">−${cost}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;
  });
  
  // Monsters
  const pinnedMonsters = state.monsters.filter(m => state.dashboardPins.monsters.includes(m.id) && (!m.hidden || state.keeperMode) && m.abilities?.length > 0);
  pinnedMonsters.forEach(monster => {
    html += `
      <div class="ability-buttons-container monster">
        <div class="ability-container-title monster">👹 ${escapeHtml(monster.name)}</div>
        ${monster.abilities.map((ability, i) => {
          const cost = ability.fearCost || 0;
          return `
            <button class="ability-btn ${cost > 0 ? 'fear-cost' : 'free'}"
              onclick="useMonsterAbility(${monster.id}, ${i})"
              onmouseenter="setHoveredAbility(${JSON.stringify(ability).replace(/"/g, '&quot;')}, false)"
              onmouseleave="clearHoveredAbility()"
              ${cost > state.fearTokens ? 'disabled' : ''}>
              <span>
                ${getAbilityTypeIcon(ability.type)} ${escapeHtml(ability.name)}
              </span>
              ${cost > 0 ? `<span class="ability-btn-cost fear">−${cost}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;
  });
  
  $('#abilityButtons').innerHTML = html;
}

function setHoveredAbility(ability, isAlly) {
  state.hoveredAbility = { ...ability, isAlly };
  renderAbilityButtons();
}

function clearHoveredAbility() {
  state.hoveredAbility = null;
  renderAbilityButtons();
}

function useAllyAbility(npcId, abilityIndex) {
  const npc = state.npcs.find(n => n.id === npcId);
  if (!npc || !npc.abilities[abilityIndex]) return;
  
  const cost = npc.abilities[abilityIndex].cost || 0;
  if (cost > 0 && (npc.hope || 0) >= cost) {
    npc.hope = (npc.hope || 0) - cost;
    renderAll();
  }
}

function useNpcAbility(npcId, abilityIndex) {
  const npc = state.npcs.find(n => n.id === npcId);
  if (!npc || !npc.abilities[abilityIndex]) return;
  
  const cost = npc.abilities[abilityIndex].cost || 0;
  if (cost > 0) {
    spendFear(cost);
    renderAll();
  }
}

function useMonsterAbility(monsterId, abilityIndex) {
  const monster = state.monsters.find(m => m.id === monsterId);
  if (!monster || !monster.abilities[abilityIndex]) return;
  
  const cost = monster.abilities[abilityIndex].fearCost || 0;
  if (cost > 0) {
    spendFear(cost);
    renderAll();
  }
}

// ==================== KEEPER MOVES ====================
function renderKeeperMoves() {
  // Soft Moves
  $('#softMoves').innerHTML = state.softMoves.map(move => `
    <button class="move-btn soft" title="${escapeHtml(move.name)}: ${escapeHtml(move.desc)}">
      ${escapeHtml(move.name)}
    </button>
  `).join('');
  
  // Hard Moves
  $('#hardMoves').innerHTML = state.hardMoves.map(move => `
    <button class="move-btn hard" 
      onclick="spendFear(${move.cost}); renderAll();"
      title="${escapeHtml(move.name)} (Cost: ${move.cost} Fear): ${escapeHtml(move.desc)}"
      ${state.fearTokens < move.cost ? 'disabled' : ''}>
      <span>${escapeHtml(move.name)}</span>
      <span class="move-cost purple">−${move.cost}</span>
    </button>
  `).join('');
  
  // Devastating Moves
  $('#devastatingMoves').innerHTML = state.devastatingMoves.map(move => `
    <button class="move-btn devastating" 
      onclick="spendFear(${move.cost}); renderAll();"
      title="${escapeHtml(move.name)} (Cost: ${move.cost} Fear): ${escapeHtml(move.desc)}"
      ${state.fearTokens < move.cost ? 'disabled' : ''}>
      <span>${escapeHtml(move.name)}</span>
      <span class="move-cost red">−${move.cost}</span>
    </button>
  `).join('');
}

// ==================== DASHBOARD SELECTOR MODAL ====================
function renderDashboardSelector() {
  let html = '';
  
  // Players
  html += `
    <div class="dashboard-selector-section">
      <div class="dashboard-selector-title players">Players</div>
      ${state.players.map(p => `
        <label class="dashboard-selector-item">
          <input type="checkbox" ${state.dashboardPins.players.includes(p.id) ? 'checked' : ''} 
            onchange="toggleDashboardPin('players', ${p.id})">
          <span>${escapeHtml(p.name)}</span>
        </label>
      `).join('')}
    </div>
  `;
  
  // NPCs
  html += `
    <div class="dashboard-selector-section">
      <div class="dashboard-selector-title npcs">NPCs</div>
      ${state.npcs.map(n => `
        <label class="dashboard-selector-item">
          <input type="checkbox" ${state.dashboardPins.npcs.includes(n.id) ? 'checked' : ''} 
            onchange="toggleDashboardPin('npcs', ${n.id})">
          <span>${escapeHtml(n.name)}</span>
          ${n.hidden ? '<span class="hidden-indicator">👁</span>' : ''}
        </label>
      `).join('')}
    </div>
  `;
  
  // Monsters
  html += `
    <div class="dashboard-selector-section">
      <div class="dashboard-selector-title monsters">Monsters</div>
      ${state.monsters.map(m => `
        <label class="dashboard-selector-item">
          <input type="checkbox" ${state.dashboardPins.monsters.includes(m.id) ? 'checked' : ''} 
            onchange="toggleDashboardPin('monsters', ${m.id})">
          <span>${escapeHtml(m.name)}</span>
          ${m.hidden ? '<span class="hidden-indicator">👁</span>' : ''}
        </label>
      `).join('')}
    </div>
  `;
  
  // Quick Actions
  html += `
    <div class="dashboard-selector-actions">
      <button class="dashboard-selector-btn" onclick="selectAllNpcs()">All NPCs</button>
      <button class="dashboard-selector-btn" onclick="clearAllNpcs()">Clear NPCs</button>
    </div>
  `;
  
  $('#dashboardSelectorContent').innerHTML = html;
}

function selectAllNpcs() {
  state.dashboardPins.npcs = state.npcs.map(n => n.id);
  renderAll();
}

function clearAllNpcs() {
  state.dashboardPins.npcs = [];
  renderAll();
}

function showDashboardSelector() {
  renderDashboardSelector();
  $('#dashboardSelectorModal').classList.remove('hidden');
}

function hideDashboardSelector() {
  $('#dashboardSelectorModal').classList.add('hidden');
}

// ==================== MAIN RENDER FUNCTIONS ====================
function renderDashboard() {
  // Scene buttons
  $('#sceneButtons').innerHTML = state.scenes.map(scene => `
    <button class="scene-btn ${state.currentScene === scene.id ? 'active' : ''}" 
      onclick="setCurrentScene(${scene.id})">${scene.id}</button>
  `).join('');
  
  // Current scene detail
  const currentSceneData = state.scenes.find(s => s.id === state.currentScene);
  if (currentSceneData) {
    $('#sceneDetail').innerHTML = renderSceneDetail(currentSceneData);
  }
  
  // Dashboard clocks (first 4)
  const visibleClocks = state.clocks.filter(c => !c.hidden || state.keeperMode).slice(0, 4);
  $('#dashboardClocks').innerHTML = visibleClocks.length > 0 
    ? visibleClocks.map(c => renderClock(c, true, false)).join('')
    : '<div class="text-center text-gray text-small" style="grid-column: span 2; padding: 1rem;">No active clocks</div>';
  
  // Dice roller
  renderDiceRoller('diceRoller');
  
  // Party status
  const pinnedPlayers = state.players.filter(p => state.dashboardPins.players.includes(p.id));
  $('#partyStatus').innerHTML = pinnedPlayers.map(p => renderDashboardCharCard(p, 'player')).join('');
  
  // NPC Dashboard
  const pinnedNpcs = state.npcs.filter(n => state.dashboardPins.npcs.includes(n.id) && (!n.hidden || state.keeperMode));
  const pinnedMonsters = state.monsters.filter(m => state.dashboardPins.monsters.includes(m.id) && (!m.hidden || state.keeperMode));
  
  if (pinnedNpcs.length > 0 || pinnedMonsters.length > 0) {
    $('#npcDashboardPanel').classList.remove('hidden');
    $('#npcDashboard').innerHTML = [
      ...pinnedNpcs.map(n => renderDashboardCharCard(n, 'npc')),
      ...pinnedMonsters.map(m => renderDashboardCharCard(m, 'monster'))
    ].join('');
  } else {
    $('#npcDashboardPanel').classList.add('hidden');
  }
  
  // Keeper-only sections
  if (state.keeperMode) {
    renderSpotlightSection();
    renderAbilityButtons();
    renderKeeperMoves();
  }
}

function setCurrentScene(sceneId) {
  state.currentScene = sceneId;
  renderDashboard();
  
  // Update save tab
  const saveScene = $('#saveCurrentScene');
  if (saveScene) saveScene.textContent = sceneId;
}

function renderPlayersTab() {
  $('#playersGrid').innerHTML = state.players.map(p => 
    renderCharacterCard(p, true, state.dashboardPins.players.includes(p.id))
  ).join('');
}

function renderNpcsTab() {
  const visibleNpcs = state.npcs.filter(n => !n.hidden || state.keeperMode);
  $('#npcsGrid').innerHTML = visibleNpcs.map(n => 
    renderCharacterCard(n, false, state.dashboardPins.npcs.includes(n.id))
  ).join('');
  
  // Hidden NPCs info
  if (state.keeperMode) {
    const hiddenNpcs = state.npcs.filter(n => n.hidden);
    if (hiddenNpcs.length > 0) {
      $('#hiddenNpcsInfo').innerHTML = `<p>👁 Hidden NPCs (Keeper Only): ${hiddenNpcs.map(n => escapeHtml(n.name)).join(', ')}</p>`;
      $('#hiddenNpcsInfo').classList.remove('hidden');
    } else {
      $('#hiddenNpcsInfo').classList.add('hidden');
    }
  }
}

function renderMonstersTab() {
  const visibleMonsters = state.monsters.filter(m => !m.hidden || state.keeperMode);
  
  // Add type property for monsters
  visibleMonsters.forEach(m => m.type = 'monster');
  
  $('#monstersGrid').innerHTML = visibleMonsters.map(m => {
    const isHidden = m.hidden && !state.keeperMode;
    if (isHidden) return '';
    
    const cardClass = 'monster';
    const expandedId = `char-expanded-monster-${m.id}`;
    
    let abilitiesHtml = '';
    if (m.abilities && m.abilities.length > 0) {
      abilitiesHtml = m.abilities.map((a, i) => {
        const costValue = a.fearCost || 0;
        
        // Check if this ability is being edited
        if (editingCharAbility && 
            editingCharAbility.charId == m.id && 
            editingCharAbility.charType === 'monster' && 
            editingCharAbility.abilityIndex === i) {
          return `
            <div class="ability-edit-form">
              <input type="text" id="edit-ability-name-monster-${m.id}-${i}" value="${escapeHtml(a.name)}" placeholder="Name">
              <select id="edit-ability-type-monster-${m.id}-${i}">
                <option value="Action" ${a.type === 'Action' ? 'selected' : ''}>Action</option>
                <option value="Reaction" ${a.type === 'Reaction' ? 'selected' : ''}>Reaction</option>
                <option value="Passive" ${a.type === 'Passive' ? 'selected' : ''}>Passive</option>
              </select>
              <input type="number" id="edit-ability-cost-monster-${m.id}-${i}" value="${costValue}" min="0" max="10">
              <input type="text" id="edit-ability-desc-monster-${m.id}-${i}" value="${escapeHtml(a.desc)}" placeholder="Description">
              <button class="save" onclick="saveEditCharAbility(${m.id}, 'monster', ${i})">✓</button>
              <button class="cancel" onclick="cancelEditCharAbility()">✕</button>
            </div>
          `;
        }
        
        return `
          <div class="ability-item">
            <span>
              ${getAbilityTypeIcon(a.type)}
              <span class="text-gray">${escapeHtml(a.name)}</span>
              <span class="ability-desc">(${escapeHtml(a.desc)})</span>
            </span>
            <div style="display: flex; align-items: center; gap: 0.25rem;">
              ${costValue > 0 ? `<span class="ability-cost fear">${costValue} Fear</span>` : ''}
              ${state.keeperMode ? `
                <button class="ability-edit-btn" onclick="startEditAbility(${m.id}, 'monster', ${i})" title="Edit">✎</button>
                <button class="ability-delete" onclick="deleteMonsterAbility(${m.id}, ${i})" title="Delete">✕</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
    
    return `
      <div class="character-card ${cardClass} ${m.hidden ? 'hidden-char' : ''}" data-char-id="${m.id}">
        <div class="character-card-header">
          <div>
            <h4 class="character-name">${escapeHtml(m.name)}</h4>
            ${m.subtitle ? `<p class="character-subtitle">${escapeHtml(m.subtitle)}</p>` : ''}
          </div>
          <div class="character-header-buttons">
            <button class="pin-btn ${state.dashboardPins.monsters.includes(m.id) ? 'pinned' : ''}" 
              onclick="toggleDashboardPin('monsters', ${m.id})"
              title="${state.dashboardPins.monsters.includes(m.id) ? 'Remove from Dashboard' : 'Pin to Dashboard'}">📌</button>
            ${m.hidden ? '<span class="hidden-indicator">👁</span>' : ''}
            <button class="expand-btn" onclick="toggleCharExpand('${expandedId}')">▶</button>
          </div>
        </div>
        
        <div class="character-stats">
          <div class="stat-row">
            <span class="stat-label">HP:</span>
            <button class="stat-btn" onclick="updateCharStat(${m.id}, 'monster', 'hp', -1)">−</button>
            <span class="${m.hp <= 0 ? 'stat-value critical' : ''}">${m.hp}/${m.maxHp}</span>
            <button class="stat-btn" onclick="updateCharStat(${m.id}, 'monster', 'hp', 1)">+</button>
          </div>
          <div class="stat-row">
            <span class="stat-label stress">Stress:</span>
            <button class="stat-btn" onclick="updateCharStat(${m.id}, 'monster', 'stress', -1)">−</button>
            <span class="${m.stress >= m.maxStress ? 'stat-value max-stress' : ''}">${m.stress}/${m.maxStress}</span>
            <button class="stat-btn" onclick="updateCharStat(${m.id}, 'monster', 'stress', 1)">+</button>
          </div>
        </div>
        
        <div class="armor-section">
          <div class="armor-header">
            <span class="text-gray">🛡 Armor: ${m.armor}</span>
            <span class="armor-thresholds">Minor ${m.armorMinor} / Severe ${m.armorSevere}</span>
          </div>
          ${m.armorSlots > 0 ? `
            <div class="armor-slots">
              ${renderArmorSlots(m)}
            </div>
          ` : ''}
        </div>
        
        <div class="evasion-row">
          Evasion: <span class="evasion-value">${m.evasion}</span>
        </div>
        
        <div id="${expandedId}" class="character-expanded hidden">
          ${m.description ? `<p class="character-description">${escapeHtml(m.description)}</p>` : ''}
          
          ${abilitiesHtml ? `
            <div class="abilities-section">
              <h5 class="abilities-title">Abilities:</h5>
              ${abilitiesHtml}
            </div>
          ` : `
            <div class="abilities-section">
              <h5 class="abilities-title">Abilities:</h5>
              <p class="text-gray text-small italic">No abilities yet</p>
            </div>
          `}
          
          ${state.keeperMode ? renderAddAbilityForm(m.id, 'monster') : ''}
          
          ${state.keeperMode && m.keeperNotes ? `
            <div class="keeper-notes-section">
              <h5 class="keeper-notes-title">Keeper Notes:</h5>
              <p class="keeper-notes-text">${escapeHtml(m.keeperNotes)}</p>
            </div>
          ` : ''}
        </div>
        
        ${state.keeperMode ? `
          <div class="char-action-buttons">
            <button class="edit-char-btn" onclick="showEditCharacterModal('monster', ${m.id})">✏️ Edit</button>
            <button class="delete-char-btn" onclick="deleteCharacter(${m.id}, 'monster')">🗑️ Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  // Hidden monsters info
  if (state.keeperMode) {
    const hiddenMonsters = state.monsters.filter(m => m.hidden);
    if (hiddenMonsters.length > 0) {
      $('#hiddenMonstersInfo').innerHTML = `<p>👁 Hidden Monsters (Keeper Only): ${hiddenMonsters.map(m => escapeHtml(m.name)).join(', ')}</p>`;
      $('#hiddenMonstersInfo').classList.remove('hidden');
    } else {
      $('#hiddenMonstersInfo').classList.add('hidden');
    }
  }
}

function deleteMonsterAbility(monsterId, abilityIndex) {
  const monster = state.monsters.find(m => m.id === monsterId);
  if (!monster || !monster.abilities) return;
  
  monster.abilities.splice(abilityIndex, 1);
  renderAll();
}

function renderScenesTab() {
  const container = $('#scenesGrid');
  if (!container) return;
  
  if (!state.scenes || state.scenes.length === 0) {
    container.innerHTML = '<div class="empty-state">No scenes yet. Click "+ Add Scene" to create one.</div>';
    return;
  }
  
  container.innerHTML = state.scenes.map((scene, index) => {
    const isCurrentScene = state.currentScene === scene.id;
    
    // Get environment info
    let envHtml = '';
    if (scene.environment && (scene.environment.macro || scene.environment.micro)) {
      const macro = scene.environment.macro ? MACRO_ENVIRONMENTS.find(e => e.id === scene.environment.macro) : null;
      const micro = scene.environment.micro ? MICRO_ENVIRONMENTS.find(e => e.id === scene.environment.micro) : null;
      
      envHtml = '<div class="scene-environment-section">';
      envHtml += '<h4 class="env-section-title">🌍 Environment Layers</h4>';
      
      if (macro) {
        const macroTier = scene.environment.macroTier ? macro.tierScaling?.find(t => t.tier === scene.environment.macroTier) : null;
        envHtml += `
          <div class="env-card macro">
            <div class="env-card-header">
              <span class="env-type-badge macro">MACRO</span>
              <strong>${escapeHtml(macro.name)}</strong>
              <span class="env-meta">
                ${macroTier ? `Tier ${macroTier.tier} • ` : ''}DC ${scene.environment.macroDC || '?'} • ${escapeHtml(macro.type)}
              </span>
            </div>
            ${macroTier ? `<div class="env-tier-info"><strong>${escapeHtml(macroTier.name)}:</strong> ${escapeHtml(macroTier.desc)}</div>` : ''}
            <p class="env-card-desc">${escapeHtml(macro.description)}</p>
            <div class="env-features">
              ${macro.features.map(f => `
                <div class="env-feature tooltip-trigger" data-tooltip="${escapeHtml(f.desc)}">
                  <span class="feature-type ${f.type.toLowerCase()}">${f.type}</span>
                  <strong>${escapeHtml(f.name)}</strong>
                  <span class="tooltip-icon">ℹ️</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      if (micro) {
        const microTier = scene.environment.microTier ? micro.tierScaling?.find(t => t.tier === scene.environment.microTier) : null;
        envHtml += `
          <div class="env-card micro">
            <div class="env-card-header">
              <span class="env-type-badge micro">MICRO</span>
              <strong>${escapeHtml(micro.name)}</strong>
              <span class="env-meta">
                ${microTier ? `Tier ${microTier.tier} • ` : ''}DC ${scene.environment.microDC || '?'} • ${escapeHtml(micro.type)}
              </span>
            </div>
            ${microTier ? `<div class="env-tier-info"><strong>${escapeHtml(microTier.name)}:</strong> ${escapeHtml(microTier.desc)}</div>` : ''}
            <p class="env-card-desc">${escapeHtml(micro.description)}</p>
            <div class="env-features">
              ${micro.features.map(f => `
                <div class="env-feature tooltip-trigger" data-tooltip="${escapeHtml(f.desc)}">
                  <span class="feature-type ${f.type.toLowerCase()}">${f.type}</span>
                  <strong>${escapeHtml(f.name)}</strong>
                  <span class="tooltip-icon">ℹ️</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      if (scene.environment.modifier) {
        envHtml += `
          <div class="env-active-modifier">
            <span class="modifier-label">⚡ Active Modifier (from Macro):</span>
            <span class="modifier-text">${escapeHtml(scene.environment.modifier)}</span>
          </div>
        `;
      }
      
      envHtml += '</div>';
    }
    
    return `
      <div class="scene-card ${isCurrentScene ? 'current' : ''}" data-scene-id="${scene.id}">
        <div class="scene-header">
          <div class="scene-number">${index + 1}</div>
          <div class="scene-title-area">
            <h3 class="scene-name">${escapeHtml(scene.name)}</h3>
            <div class="scene-location">📍 ${escapeHtml(scene.location || 'Unknown Location')}</div>
          </div>
          ${isCurrentScene ? '<span class="current-badge">▶ ACTIVE</span>' : ''}
        </div>
        
        ${scene.notes ? `<p class="scene-notes">${escapeHtml(scene.notes)}</p>` : ''}
        
        ${envHtml}
        
        ${scene.details ? `
          <div class="scene-details">
            ${scene.details.atmosphere ? `<div class="scene-detail"><strong>🎭 Atmosphere:</strong> ${escapeHtml(scene.details.atmosphere)}</div>` : ''}
            ${scene.details.objectives && scene.details.objectives.length > 0 ? `
              <div class="scene-detail">
                <strong>🎯 Objectives:</strong>
                <ul>${scene.details.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${scene.details.keyRolls && scene.details.keyRolls.length > 0 ? `
              <div class="scene-detail">
                <strong>🎲 Key Rolls:</strong>
                <ul>${scene.details.keyRolls.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${scene.details.npcsPresent && scene.details.npcsPresent.length > 0 ? `
              <div class="scene-detail">
                <strong>👥 NPCs Present:</strong> ${scene.details.npcsPresent.map(n => escapeHtml(n)).join(', ')}
              </div>
            ` : ''}
            ${scene.details.possibleOutcomes && scene.details.possibleOutcomes.length > 0 && state.keeperMode ? `
              <div class="scene-detail keeper-only">
                <strong>📊 Possible Outcomes:</strong>
                <ul>${scene.details.possibleOutcomes.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${scene.details.tips && state.keeperMode ? `<div class="scene-tip keeper-only">💡 <em>${escapeHtml(scene.details.tips)}</em></div>` : ''}
          </div>
        ` : ''}
        
        <div class="scene-actions">
          <button class="btn btn-small ${isCurrentScene ? 'btn-green' : 'btn-gray'}" onclick="setCurrentScene(${scene.id})">
            ${isCurrentScene ? '✓ Current' : 'Set Active'}
          </button>
          ${state.keeperMode ? `
            <button class="btn btn-small btn-blue" onclick="showEditSceneModal(${scene.id})">✏️ Edit</button>
            <button class="btn btn-small btn-red-dark" onclick="deleteScene(${scene.id})">🗑️</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderClocksTab() {
  $('#clocksGrid').innerHTML = state.clocks.filter(c => !c.hidden || state.keeperMode)
    .map(c => renderClock(c, false, true)).join('');
}

function renderNotesTab() {
  $('#notesTextarea').value = state.notes;
}

function renderSaveTab() {
  $('#saveSessionName').value = state.sessionName;
  $('#saveCurrentScene').textContent = state.currentScene;
  $('#saveFearTokens').textContent = `${state.fearTokens}/12`;
}

function renderAll() {
  // Update keeper mode body class
  document.body.classList.toggle('keeper-mode', state.keeperMode);
  
  // Update fear display
  updateFearDisplay();
  
  // Render active tab
  renderDashboard();
  renderPlayersTab();
  renderNpcsTab();
  renderMonstersTab();
  renderScenesTab();
  renderClocksTab();
  renderDiceRoller('fullDiceRoller');
  renderNotesTab();
  renderSaveTab();
}

// Continue in next part...


// ==================== TAB NAVIGATION ====================
function switchTab(tabName) {
  state.activeTab = tabName;
  
  // Update tab buttons
  $$('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab content
  $$('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });
}

// ==================== SAVE/LOAD ====================
function saveGame() {
  const saveData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    sessionName: state.sessionName,
    fearTokens: state.fearTokens,
    currentScene: state.currentScene,
    notes: state.notes,
    spotlightFocus: state.spotlightFocus,
    dashboardPins: state.dashboardPins,
    clocks: state.clocks,
    players: state.players,
    npcs: state.npcs,
    monsters: state.monsters,
    diceRoller: {
      modifier: state.diceRoller.modifier,
      advantage: state.diceRoller.advantage,
      difficulty: state.diceRoller.difficulty,
      rollHistory: state.diceRoller.rollHistory
    }
  };
  
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.sessionName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  state.lastSaved = new Date().toLocaleTimeString();
  $('#lastSaved').textContent = `Saved: ${state.lastSaved}`;
}

function loadGame(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const saveData = JSON.parse(e.target.result);
      
      // Restore state
      state.sessionName = saveData.sessionName || state.sessionName;
      state.fearTokens = saveData.fearTokens || 0;
      state.currentScene = saveData.currentScene || 1;
      state.notes = saveData.notes || '';
      state.spotlightFocus = saveData.spotlightFocus || null;
      state.dashboardPins = saveData.dashboardPins || state.dashboardPins;
      state.clocks = saveData.clocks || state.clocks;
      state.players = saveData.players || state.players;
      state.npcs = saveData.npcs || state.npcs;
      state.monsters = saveData.monsters || state.monsters;
      
      if (saveData.diceRoller) {
        state.diceRoller.modifier = saveData.diceRoller.modifier || 0;
        state.diceRoller.advantage = saveData.diceRoller.advantage || 'normal';
        state.diceRoller.difficulty = saveData.diceRoller.difficulty || 15;
        state.diceRoller.rollHistory = saveData.diceRoller.rollHistory || [];
      }
      
      state.lastSaved = new Date(saveData.timestamp).toLocaleTimeString();
      $('#lastSaved').textContent = `Loaded: ${state.lastSaved}`;
      $('#sessionNameInput').value = state.sessionName;
      
      renderAll();
      alert('Game loaded successfully!');
    } catch (err) {
      alert('Error loading save file: ' + err.message);
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

// ==================== ADD CHARACTER MODAL ====================
function showAddCharacterModal(type) {
  $('#addCharType').value = type;
  if ($('#addCharEditId')) $('#addCharEditId').value = '';  // Clear edit ID for new character
  $('#addCharModal').classList.remove('hidden');
  
  // Update modal title
  const titles = { player: 'Add Player', npc: 'Add NPC', monster: 'Add Monster' };
  $('#addCharModalTitle').textContent = titles[type] || 'Add Character';
  
  // Show/hide ally checkbox (only for NPCs)
  $('#allyCheckboxContainer').classList.toggle('hidden', type !== 'npc');
  
  // Show/hide abilities editor (for NPCs and Monsters)
  const showAbilities = type === 'npc' || type === 'monster';
  const abilitiesEditor = $('#abilitiesEditorContainer');
  if (abilitiesEditor) {
    abilitiesEditor.classList.toggle('hidden', !showAbilities);
  }
  
  // Clear modal abilities
  state.modalAbilities = [];
  state.editingAbilityIndex = null;
  renderModalAbilities();
  
  // Update cost type label
  updateCostTypeLabel();
  
  // Clear form
  $('#addCharName').value = '';
  $('#addCharSubtitle').value = '';
  $('#addCharHp').value = '7';
  $('#addCharMaxStress').value = '6';
  $('#addCharArmor').value = '3';
  $('#addCharMinor').value = '5';
  $('#addCharSevere').value = '10';
  $('#addCharArmorSlots').value = '3';
  $('#addCharEvasion').value = '10';
  $('#addCharDescription').value = '';
  $('#addCharKeeperNotes').value = '';
  $('#addCharHidden').checked = false;
  $('#addCharIsAlly').checked = false;
  
  // Clear ability input fields
  clearAbilityInputs();
}

function hideAddCharacterModal() {
  $('#addCharModal').classList.add('hidden');
  state.modalAbilities = [];
  state.editingAbilityIndex = null;
}

function addCharacter() {
  const type = $('#addCharType').value;
  const editId = $('#addCharEditId')?.value;
  const name = $('#addCharName').value.trim();
  if (!name) {
    alert('Please enter a name');
    return;
  }
  
  const charData = {
    name: name,
    subtitle: $('#addCharSubtitle').value.trim(),
    hp: parseInt($('#addCharHp').value) || 7,
    maxHp: parseInt($('#addCharHp').value) || 7,
    stress: 0,
    maxStress: parseInt($('#addCharMaxStress').value) || 6,
    armor: parseInt($('#addCharArmor').value) || 3,
    armorMinor: parseInt($('#addCharMinor').value) || 5,
    armorSevere: parseInt($('#addCharSevere').value) || 10,
    armorSlots: parseInt($('#addCharArmorSlots').value) || 3,
    armorMarked: [],
    evasion: parseInt($('#addCharEvasion').value) || 10,
    description: $('#addCharDescription').value.trim(),
    abilities: [],
    hidden: $('#addCharHidden').checked
  };
  
  // Check if we're editing an existing character
  if (editId) {
    const id = parseInt(editId);
    let existingChar;
    let list;
    
    if (type === 'player') {
      existingChar = state.players.find(p => p.id === id);
      list = state.players;
    } else if (type === 'npc') {
      existingChar = state.npcs.find(n => n.id === id);
      list = state.npcs;
    } else {
      existingChar = state.monsters.find(m => m.id === id);
      list = state.monsters;
    }
    
    if (existingChar) {
      // Preserve id and current hp/stress
      charData.id = id;
      charData.hp = Math.min(existingChar.hp, charData.maxHp);
      charData.stress = existingChar.stress || 0;
      charData.armorMarked = existingChar.armorMarked || [];
      
      if (type === 'player') {
        charData.hope = existingChar.hope || 2;
        charData.equipment = existingChar.equipment || '';
      } else if (type === 'npc') {
        charData.isAlly = $('#addCharIsAlly').checked;
        charData.hope = charData.isAlly ? (existingChar.hope || 2) : undefined;
        charData.abilities = state.modalAbilities.map(a => ({
          name: a.name, type: a.type, cost: a.cost || 0, desc: a.desc
        }));
        charData.keeperNotes = $('#addCharKeeperNotes').value.trim();
      } else {
        charData.abilities = state.modalAbilities.map(a => ({
          name: a.name, type: a.type, fearCost: a.cost || 0, desc: a.desc
        }));
        charData.keeperNotes = $('#addCharKeeperNotes').value.trim();
        charData.behavior = existingChar.behavior || '';
      }
      
      // Replace in list
      const index = list.findIndex(c => c.id === id);
      if (index !== -1) {
        list[index] = charData;
      }
    }
  } else {
    // Adding new character
    charData.id = Date.now();
    
    if (type === 'player') {
      charData.hope = 2;
      charData.equipment = '';
      state.players.push(charData);
    } else if (type === 'npc') {
      charData.isAlly = $('#addCharIsAlly').checked;
      if (charData.isAlly) {
        charData.hope = 2;
      }
      charData.abilities = state.modalAbilities.map(a => ({
        name: a.name, type: a.type, cost: a.cost || 0, desc: a.desc
      }));
      charData.keeperNotes = $('#addCharKeeperNotes').value.trim();
      state.npcs.push(charData);
    } else {
      charData.abilities = state.modalAbilities.map(a => ({
        name: a.name, type: a.type, fearCost: a.cost || 0, desc: a.desc
      }));
      charData.keeperNotes = $('#addCharKeeperNotes').value.trim();
      state.monsters.push(charData);
    }
  }
  
  // Clear edit ID and modal state
  if ($('#addCharEditId')) $('#addCharEditId').value = '';
  state.modalAbilities = [];
  state.editingAbilityIndex = null;
  
  hideAddCharacterModal();
  renderAll();
}

// ==================== MODAL ABILITIES FUNCTIONS ====================
function updateCostTypeLabel() {
  const type = $('#addCharType')?.value;
  const isAlly = $('#addCharIsAlly')?.checked;
  const costType = (type === 'npc' && isAlly) ? 'Hope' : 'Fear';
  const costClass = (type === 'npc' && isAlly) ? 'hope' : 'fear';
  
  const indicator = $('#costTypeIndicator');
  const label = $('#costTypeLabel');
  
  if (indicator) {
    indicator.textContent = `(Cost: ${costType})`;
    indicator.className = `cost-type-label ${costClass}`;
  }
  if (label) {
    label.textContent = costType;
    label.className = `cost-type-label ${costClass}`;
  }
}

function clearAbilityInputs() {
  const nameEl = $('#newAbilityName');
  const typeEl = $('#newAbilityType');
  const costEl = $('#newAbilityCost');
  const descEl = $('#newAbilityDesc');
  
  if (nameEl) nameEl.value = '';
  if (typeEl) typeEl.value = 'Action';
  if (costEl) costEl.value = '0';
  if (descEl) descEl.value = '';
}

function renderModalAbilities() {
  const list = $('#abilitiesList');
  if (!list) return;
  
  const type = $('#addCharType')?.value;
  const isAlly = $('#addCharIsAlly')?.checked;
  const costType = (type === 'npc' && isAlly) ? 'Hope' : 'Fear';
  const costClass = (type === 'npc' && isAlly) ? 'hope' : 'fear';
  
  if (state.modalAbilities.length === 0) {
    list.innerHTML = '<div class="no-abilities">No abilities added yet</div>';
    return;
  }
  
  list.innerHTML = state.modalAbilities.map((ability, index) => {
    // Check if this ability is being edited
    if (state.editingAbilityIndex === index) {
      return `
        <div class="ability-edit-form">
          <input type="text" id="editAbilityName" value="${escapeHtml(ability.name)}" placeholder="Name">
          <select id="editAbilityType">
            <option value="Action" ${ability.type === 'Action' ? 'selected' : ''}>Action</option>
            <option value="Reaction" ${ability.type === 'Reaction' ? 'selected' : ''}>Reaction</option>
            <option value="Passive" ${ability.type === 'Passive' ? 'selected' : ''}>Passive</option>
          </select>
          <input type="number" id="editAbilityCost" value="${ability.cost || 0}" min="0" max="10">
          <input type="text" id="editAbilityDesc" value="${escapeHtml(ability.desc)}" placeholder="Description">
          <button class="save" onclick="saveEditAbility(${index})">✓</button>
          <button class="cancel" onclick="cancelEditAbility()">✕</button>
        </div>
      `;
    }
    
    return `
      <div class="ability-list-item">
        <div class="ability-list-item-info">
          <span class="ability-list-item-name">${escapeHtml(ability.name)}</span>
          <span class="ability-list-item-type ${ability.type.toLowerCase()}">${ability.type}</span>
          ${ability.cost > 0 ? `<span class="ability-list-item-cost ${costClass}">${ability.cost} ${costType}</span>` : ''}
          <span class="ability-list-item-desc">${escapeHtml(ability.desc)}</span>
        </div>
        <div class="ability-list-item-actions">
          <button class="ability-list-item-edit" onclick="editModalAbility(${index})" title="Edit">✎</button>
          <button class="ability-list-item-delete" onclick="removeModalAbility(${index})" title="Remove">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function addModalAbility() {
  const nameEl = $('#newAbilityName');
  const typeEl = $('#newAbilityType');
  const costEl = $('#newAbilityCost');
  const descEl = $('#newAbilityDesc');
  
  const name = nameEl?.value.trim();
  if (!name) {
    alert('Please enter an ability name');
    return;
  }
  
  const newAbility = {
    name: name,
    type: typeEl?.value || 'Action',
    cost: parseInt(costEl?.value) || 0,
    desc: descEl?.value.trim() || 'No description'
  };
  
  state.modalAbilities.push(newAbility);
  renderModalAbilities();
  clearAbilityInputs();
}

function removeModalAbility(index) {
  state.modalAbilities.splice(index, 1);
  state.editingAbilityIndex = null;
  renderModalAbilities();
}

function editModalAbility(index) {
  state.editingAbilityIndex = index;
  renderModalAbilities();
}

function saveEditAbility(index) {
  const nameEl = $('#editAbilityName');
  const typeEl = $('#editAbilityType');
  const costEl = $('#editAbilityCost');
  const descEl = $('#editAbilityDesc');
  
  const name = nameEl?.value.trim();
  if (!name) {
    alert('Please enter an ability name');
    return;
  }
  
  state.modalAbilities[index] = {
    name: name,
    type: typeEl?.value || 'Action',
    cost: parseInt(costEl?.value) || 0,
    desc: descEl?.value.trim() || 'No description'
  };
  
  state.editingAbilityIndex = null;
  renderModalAbilities();
}

function cancelEditAbility() {
  state.editingAbilityIndex = null;
  renderModalAbilities();
}

// ==================== KEEPER MODE TOGGLE ====================
function toggleKeeperMode() {
  state.keeperMode = !state.keeperMode;
  
  // Update button
  const btn = $('#keeperModeBtn');
  btn.classList.toggle('active', state.keeperMode);
  btn.textContent = state.keeperMode ? '👁 Keeper Mode' : '👁 Player Mode';
  
  renderAll();
}

// ==================== SESSION NAME ====================
function updateSessionName(value) {
  state.sessionName = value;
  $('#saveSessionName').value = value;
}

// ==================== NOTES ====================
function updateNotes(value) {
  state.notes = value;
}

function clearNotes() {
  if (confirm('Are you sure you want to clear all notes?')) {
    state.notes = '';
    $('#notesTextarea').value = '';
  }
}

// ==================== FEAR TOKENS ====================
function adjustFear(delta) {
  state.fearTokens = Math.max(0, Math.min(12, state.fearTokens + delta));
  updateFearDisplay();
}

// ==================== EMBEDDED CAMPAIGN TEMPLATES ====================
function getEmbeddedTemplate(templateId) {
  if (templateId === 'hearts_in_the_void') {
    return getHeartsInTheVoidTemplate();
  } else if (templateId === 'derelicts_secret') {
    return getDerelictsSecretTemplate();
  } else if (templateId === 'example_campaign') {
    return getExampleCampaignTemplate();
  }
  return null;
}

function getHeartsInTheVoidTemplate() {
  return {
    sessionName: 'Hearts in the Void - Session 1',
    fearTokens: 0,
    currentScene: 1,
    notes: '',
    dashboardPins: { players: [1, 2, 3, 4, 5, 6], npcs: [1, 3], monsters: [1] },
    clocks: [
      { id: 1, name: "Korren's Desperation", segments: 4, filled: 0, hidden: false },
      { id: 2, name: "Core Overload", segments: 4, filled: 0, hidden: false },
      { id: 3, name: "Structural Collapse", segments: 6, filled: 0, hidden: false },
      { id: 4, name: "The Swarm Catches You", segments: 4, filled: 0, hidden: false }
    ],
    players: [
      { id: 1, name: 'Spark', subtitle: 'Human Engineer', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 9, abilities: ['Scrap Genius (3 Hope)', 'Technical Intuition', 'Digital Ghost'], equipment: 'Plasma Pistol, Multi-tool, Hacking Kit' },
      { id: 2, name: 'Marcus', subtitle: 'Human Soldier', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 4, armorMinor: 8, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 9, abilities: ['Combat Surge (2 Hope)', 'Combat Focus', 'Bodyguard Protocol'], equipment: 'Assault Rifle, Riot Shield' },
      { id: 3, name: 'Whisper', subtitle: 'Ethereal Mystic', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 5, armorSevere: 11, armorSlots: 2, armorMarked: [], evasion: 10, abilities: ['Path to Nirvana (3 Hope)', 'Unbroken Focus', 'Veil Sight'], equipment: 'Ceremonial Robes, Emergency Blaster' },
      { id: 4, name: 'Dr. Lyra', subtitle: 'Kryllian Scholar', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 9, abilities: ['Eureka Moment (3 Hope)', 'Analytical Mind', 'Combat Medicine'], equipment: 'Medical Kit, Biological Scanner' },
      { id: 5, name: 'Flash', subtitle: 'Celestiari Pilot', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 5, armorSevere: 11, armorSlots: 2, armorMarked: [], evasion: 11, abilities: ['Veil Surge (3 Hope)', 'Stellar Instinct', "Pathfinder's Sense"], equipment: 'Energy Pistol, Starcharts' },
      { id: 6, name: 'Shadow', subtitle: 'Synthetic Scoundrel', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 4, armorMinor: 7, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 12, abilities: ['Vanishing Act (3 Hope)', 'Shadow Operative', 'Blend with Crowd'], equipment: 'Gauss Pistol, Morphic Key, Holo-Mask' }
    ],
    npcs: [
      { id: 1, name: 'Zara Kaine', subtitle: 'Iron Hearts Captain', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 12, description: "Pilot with a laugh like thunder. In love with Alexei. Can't cook—once started a fire in space.", abilities: [{ name: 'Expert Pilot', type: 'Passive', cost: 0, desc: '+2 to all piloting checks' }, { name: 'Cover Fire', type: 'Action', cost: 1, desc: 'Suppress enemies, giving allies advantage on movement' }], keeperNotes: 'Will NOT leave Alexei. Protective.', hidden: false, isAlly: true },
      { id: 2, name: 'Alexei Joric', subtitle: 'The "Kidnapped" Nobleman', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 1, armor: 1, armorMinor: 3, armorSevere: 6, armorSlots: 1, armorMarked: [], evasion: 11, description: 'Young poet with terrible poetry. Useless in combat. Quotes verse when nervous.', abilities: [{ name: 'Terrible Poetry', type: 'Action', cost: 0, desc: 'Recite poetry. Enemies may be distracted or annoyed' }, { name: 'Noble Bearing', type: 'Passive', cost: 0, desc: '+1 to social checks with nobility' }], keeperNotes: 'Non-combatant. Liability in fights.', hidden: false, isAlly: true },
      { id: 3, name: 'Brix', subtitle: 'Loyal Kryx', hp: 10, maxHp: 10, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 6, armorSevere: 12, armorSlots: 3, armorMarked: [], evasion: 11, description: "Massive wolf-alien. Doesn't understand human customs. Treats handshakes as combat.", abilities: [{ name: 'Brutal Charge', type: 'Action', cost: 1, desc: 'Charge and knockdown, +4 attack, 2d6 damage' }, { name: 'Pack Loyalty', type: 'Reaction', cost: 1, desc: 'Intercept attack meant for Zara, take damage instead' }, { name: 'Intimidating Presence', type: 'Passive', cost: 0, desc: 'Enemies have disadvantage on first attack against party' }], keeperNotes: 'Charges biggest threat. Loyal to Zara.', hidden: false, isAlly: true },
      { id: 4, name: 'Korren', subtitle: 'The Traitor', hp: 8, maxHp: 8, stress: 0, maxStress: 7, armor: 5, armorMinor: 10, armorSevere: 20, armorSlots: 5, armorMarked: [], evasion: 10, description: 'Kryllian engineer drowning in gambling debt. Worst luck in the galaxy.', abilities: [{ name: 'Heavy Weapons', type: 'Action', cost: 0, desc: '+3 attack with heavy weapons, 2d8 damage' }, { name: 'Sabotage', type: 'Action', cost: 1, desc: 'Disable a system or device, DC 14 to notice' }, { name: 'Engineering', type: 'Passive', cost: 0, desc: 'Can repair or jury-rig most tech' }], keeperNotes: 'TRAITOR. Will betray when clock fills. Desperate, not evil.', hidden: true, isAlly: false },
      { id: 5, name: 'Thex', subtitle: 'The Manipulator', hp: 6, maxHp: 6, stress: 0, maxStress: 6, armor: 2, armorMinor: 4, armorSevere: 8, armorSlots: 2, armorMarked: [], evasion: 10, description: "Ethereal obsessed with wealth. No idea what things cost. Makes dramatic pronouncements nobody listens to.", abilities: [{ name: 'Emotional Manipulation', type: 'Action', cost: 1, desc: 'DC 14 Presence or target believes a lie' }, { name: 'Time Sight', type: 'Action', cost: 2, desc: 'Glimpse 1 round into future, gain advantage' }], keeperNotes: 'TRAITOR. Works with Korren. Hangs back in fights.', hidden: true, isAlly: false },
      { id: 6, name: 'Madame Silk', subtitle: 'Assassin Leader', hp: 8, maxHp: 8, stress: 0, maxStress: 6, armor: 4, armorMinor: 7, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 15, description: 'Rift Spinner assassin. Art snob about killing. Once let target live for better lighting.', abilities: [{ name: 'Camouflage', type: 'Action', cost: 1, desc: 'Become invisible until attack or damaged' }, { name: 'Filament Strike', type: 'Action', cost: 0, desc: '+5 attack, 2d8 damage, ignores 2 armor' }, { name: 'Ambush', type: 'Reaction', cost: 2, desc: 'When revealed, make free attack with advantage' }], keeperNotes: 'Invisible until strikes. Flanks. Targets weakest.', hidden: true, isAlly: false },
      { id: 7, name: 'Scalpel', subtitle: 'Medical Torturer', hp: 8, maxHp: 8, stress: 0, maxStress: 6, armor: 3, armorMinor: 6, armorSevere: 12, armorSlots: 3, armorMarked: [], evasion: 12, description: 'Inappropriately cheerful. Offers tea to torture victims. Hums while working.', abilities: [{ name: 'Surgical Strike', type: 'Action', cost: 0, desc: '+4 attack, 1d10 damage, +2 Stress on hit' }, { name: 'Toxins', type: 'Action', cost: 1, desc: 'Apply poison: DC 13 or 1d6 damage per round' }, { name: 'Medical Knowledge', type: 'Passive', cost: 0, desc: 'Can stabilize or harm with equal skill' }], keeperNotes: 'Targets wounded. May offer deals.', hidden: true, isAlly: false },
      { id: 8, name: 'Maya Santos', subtitle: 'Amaranth Agent', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 1, armor: 2, armorMinor: 4, armorSevere: 8, armorSlots: 2, armorMarked: [], evasion: 11, description: "Nothing surprises her anymore. Sighs constantly. Will nod at any plan.", abilities: [{ name: 'Concealed Weapon', type: 'Reaction', cost: 1, desc: 'Surprise attack when least expected, +3, 1d8' }, { name: 'Information Network', type: 'Action', cost: 1, desc: 'Contact sources, learn one secret about target' }], keeperNotes: 'Quest giver. Not meant for combat.', hidden: false, isAlly: true }
    ],
    monsters: [
      { id: 1, name: 'Hunger Weaver', subtitle: 'Individual', hp: 4, maxHp: 4, stress: 0, maxStress: 3, armor: 0, armorMinor: 6, armorSevere: 10, armorSlots: 0, armorMarked: [], evasion: 12, description: 'Crystalline jellyfish. Feeds on bio-electric energy.', abilities: [{ name: 'Draining Tentacle', type: 'Action', fearCost: 0, desc: '+3, 1d6 Magic, DC 13 or +1 Stress' }, { name: 'Hypnotic Illusions', type: 'Action', fearCost: 1, desc: 'DC 12 Presence or Fascinated for 1 round' }, { name: 'Fluid Form', type: 'Passive', fearCost: 0, desc: 'Can pass through 5cm gaps' }], keeperNotes: 'Weak to bright light and high-frequency sound.', hidden: false },
      { id: 2, name: 'Weaver Swarm', subtitle: '4-5 Weavers', hp: 16, maxHp: 16, stress: 0, maxStress: 6, armor: 0, armorMinor: 6, armorSevere: 10, armorSlots: 0, armorMarked: [], evasion: 14, description: 'Coordinated group. Sets ambushes. Learns.', abilities: [{ name: 'Multi-Attack', type: 'Action', fearCost: 1, desc: 'Attack 2 different targets' }, { name: 'Swarm Tactics', type: 'Passive', fearCost: 0, desc: '+2 to hit when near allies' }, { name: 'Overwhelming Numbers', type: 'Reaction', fearCost: 2, desc: 'When hit, spawn 1d4 new Weavers' }], keeperNotes: 'More arrive every 2-3 rounds during chaos.', hidden: true },
      { id: 3, name: 'Weaver Queen (Phase 1)', subtitle: 'Boss - The Sovereign', hp: 25, maxHp: 25, stress: 0, maxStress: 0, armor: 0, armorMinor: 8, armorSevere: 14, armorSlots: 0, armorMarked: [], evasion: 13, description: 'Ancient, massive, alien intelligence. Defensive and calculating at first.', abilities: [{ name: 'Psionic Scream', type: 'Action', fearCost: 2, desc: 'All in area: DC 15 Presence or 2d6 damage + 2 Stress' }, { name: 'Summon Swarm', type: 'Action', fearCost: 1, desc: 'Spawn 1d4 Hunger Weavers' }, { name: 'Psychic Shield', type: 'Reaction', fearCost: 1, desc: 'Reduce incoming damage by 1d6' }], keeperNotes: 'Transforms to Phase 2 at 12 HP or less.', hidden: true },
      { id: 4, name: 'Weaver Queen (Phase 2)', subtitle: 'Boss - The Desperate', hp: 20, maxHp: 20, stress: 0, maxStress: 0, armor: 0, armorMinor: 10, armorSevere: 18, armorSlots: 0, armorMarked: [], evasion: 11, description: 'Wounded and enraged. Abandons all caution.', abilities: [{ name: 'Frenzy', type: 'Passive', fearCost: 0, desc: '+2 to all attacks, -2 to Evasion' }, { name: 'Consume Minion', type: 'Action', fearCost: 0, desc: 'Destroy a Weaver to heal 1d8 HP' }, { name: 'Death Throes', type: 'Reaction', fearCost: 3, desc: 'On death: All in area take 3d6 damage' }], keeperNotes: 'Desperate. Will sacrifice minions. Make death dramatic.', hidden: true }
    ],
    scenes: [
      { id: 1, name: 'Scene 1: The Offer', location: 'Nexus Inferior Bar', notes: 'Maya Santos hires the crew', details: { atmosphere: 'Smoke curls through recycled air. The bar\'s neon sign flickers in shades of dying pink. At a corner booth, a woman in a grey coat waits.', objectives: ['Meet Maya Santos', 'Accept the contract', 'Learn about the Iron Hearts'], keyRolls: ['Presence + Insight (DC 12) to read Maya', 'Knowledge + Streetwise (DC 14) for Iron Hearts info'], npcsPresent: ['Maya Santos'], possibleOutcomes: ['Accept: Story continues', 'Negotiate: Better terms possible', 'Refuse: Maya finds other means'], tips: 'Maya is tired but professional. She\'s seen too much.' } },
      { id: 2, name: 'Scene 2: Securing Transport', location: 'Crossroads Station', notes: 'Find passage to Charon\'s Refuge', details: { atmosphere: 'The station hums with commerce and desperation. Ships dock and depart. Someone here can get you where you need to go.', objectives: ['Find transport', 'Negotiate passage', 'Prepare for the journey'], keyRolls: ['Presence + Persuasion (DC 12) to find a captain', 'Knowledge + Trade (DC 14) for fair price'], npcsPresent: [], possibleOutcomes: ['Success: Fast, safe passage', 'Partial: Slow but safe', 'Failure: Dangerous route'], tips: 'Introduce potential complications for later.' } },
      { id: 3, name: 'Scene 3: Arrival', location: "Charon's Refuge", notes: 'The derelict station. First encounter with the Iron Hearts.', details: { atmosphere: "The station drifts in the shadow of a dead moon. Half its lights are dark. The Iron Hearts' ship, The Stubborn Echo, is docked at bay 7.", objectives: ['Board the station', 'Find the Iron Hearts', 'Assess the situation'], keyRolls: ['Instinct + Perception (DC 12) to spot dangers', 'Finesse + Stealth (DC 14) to approach unseen'], npcsPresent: ['Zara Kaine', 'Brix', 'Alexei Joric'], possibleOutcomes: ['Peaceful: Earn trust quickly', 'Tense: Trust must be built', 'Hostile: Mistaken for enemies'], tips: 'First impressions matter. Let players choose their approach.' } },
      { id: 4, name: 'Scene 4: Shadows', location: 'Residential Zone', notes: 'Strange occurrences. First hints of the Weavers.', details: { atmosphere: 'The corridors are too quiet. Lights flicker. Something moves in the darkness between sections.', objectives: ['Investigate disappearances', 'Find evidence', 'Survive first encounter'], keyRolls: ['Instinct + Survival (DC 14) to track movement', 'Knowledge + Tech (DC 12) to analyze evidence'], npcsPresent: ['Korren', 'Thex'], possibleOutcomes: ['Discovery: Learn about Weavers early', 'Partial: Hints but no confirmation', 'Ambush: Surprise attack'], tips: 'Build tension. The Weavers are watching.' } },
      { id: 5, name: 'Scene 5: Broken Heart', location: 'Engine Room', notes: "The station's heart is failing. Sabotage discovered.", details: { atmosphere: 'The reactor core groans. Warning lights paint everything red. Someone has been here before you.', objectives: ['Assess the damage', 'Find the saboteur', 'Prevent catastrophe'], keyRolls: ['Knowledge + Tech (DC 15) to understand sabotage', 'Instinct + Investigation (DC 14) to find clues'], npcsPresent: ['Korren'], possibleOutcomes: ['Success: Stop the overload', 'Partial: Buy time', 'Failure: Clock advances'], tips: "This is where Korren's betrayal becomes clear." } },
      { id: 6, name: 'Scene 6: Betrayal', location: 'Engine Room', notes: "Korren's clock fills. The traitors reveal themselves.", details: { atmosphere: "Korren's hands shake as he levels his weapon. Behind him, Thex smiles. 'Nothing personal. Just business.'", objectives: ['Survive the betrayal', 'Protect allies', 'Make a choice about Korren'], keyRolls: ['Combat rolls', 'Presence + Persuasion (DC 16) to talk Korren down'], npcsPresent: ['Korren', 'Thex', 'Zara Kaine'], possibleOutcomes: ['Korren dies: Simple but tragic', 'Korren redeemed: Harder but hopeful', 'Everyone survives: Nearly impossible'], tips: 'Korren is desperate, not evil. Make his choice feel real.' } },
      { id: 7, name: 'Scene 7: Desperate Escape', location: 'Corridors', notes: 'The Weaver swarm attacks. Run for the ship.', details: { atmosphere: 'The walls writhe with crystalline bodies. The Weavers have stopped hunting. Now they\'re swarming.', objectives: ['Reach the ship', 'Protect civilians', "Don't get separated"], keyRolls: ['Agility + Athletics (DC 14) to outrun', 'Combat to clear paths'], npcsPresent: ['Zara Kaine', 'Brix', 'Alexei Joric'], possibleOutcomes: ['Clean escape: Everyone makes it', 'Losses: Someone falls behind', 'Trapped: Must fight the Queen'], tips: 'This should feel desperate. Use the Swarm clock.' } },
      { id: 8, name: 'Scene 8: Resolution', location: 'Ship Cockpit', notes: 'Escape and aftermath. What happens next?', details: { atmosphere: "Stars streak past as the Stubborn Echo clears the station. Behind you, Charon's Refuge burns. Ahead lies uncertain future.", objectives: ['Escape the station', 'Assess losses', 'Plan next steps'], keyRolls: ['Finesse + Piloting (DC 12) to escape safely'], npcsPresent: ['Surviving NPCs'], possibleOutcomes: ['Victory: Safe with allies', 'Pyrrhic: Safe but scarred', 'Cliffhanger: Queen survives'], tips: 'Let players feel the weight of their choices.' } }
    ],
    diceRoller: { modifier: 0, advantage: 'normal', difficulty: 15, results: null, rollHistory: [] }
  };
}

function getDerelictsSecretTemplate() {
  return {
    sessionName: "The Derelict's Secret - Quickstart",
    fearTokens: 0,
    currentScene: 1,
    notes: '',
    dashboardPins: { players: [1, 2, 3, 4, 5, 6, 7], npcs: [1, 2], monsters: [] },
    clocks: [
      { id: 1, name: "Reprogramming", segments: 4, filled: 0, hidden: false },
      { id: 2, name: "Temporal Collapse", segments: 6, filled: 0, hidden: false },
      { id: 3, name: "Time Until Midnight", segments: 8, filled: 0, hidden: false }
    ],
    players: [
      { id: 1, name: 'Void Runner', subtitle: 'Pre-Gen Character', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 5, armorSevere: 10, armorSlots: 2, armorMarked: [], evasion: 11, abilities: ['Ship Systems (+2)', 'Zero-G Navigation', 'Salvage Expert'], equipment: 'Space Suit, Tether Line, Scanner' },
      { id: 2, name: 'Corporate Enforcer', subtitle: 'Pre-Gen Character', hp: 8, maxHp: 8, stress: 0, maxStress: 6, hope: 2, armor: 4, armorMinor: 8, armorSevere: 16, armorSlots: 4, armorMarked: [], evasion: 9, abilities: ['Combat Training (+2)', 'Intimidation', 'Company Protocols'], equipment: 'Combat Armor, Assault Rifle, Stun Baton' },
      { id: 3, name: 'Relic Seeker', subtitle: 'Pre-Gen Character', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 4, armorSevere: 9, armorSlots: 2, armorMarked: [], evasion: 10, abilities: ['Precursor Tech (+2)', 'Ancient Languages', 'Temporal Sense'], equipment: 'Scanner Array, Reference Tablet, Artifact Case' },
      { id: 4, name: 'Street Medic', subtitle: 'Pre-Gen Character', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 5, armorSevere: 10, armorSlots: 2, armorMarked: [], evasion: 10, abilities: ['Medical Knowledge (+2)', 'Triage', 'Field Surgery'], equipment: 'Medical Kit, Sedatives, Emergency Supplies' },
      { id: 5, name: 'Trade Ambassador', subtitle: 'Pre-Gen Character', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 1, armorMinor: 3, armorSevere: 6, armorSlots: 1, armorMarked: [], evasion: 10, abilities: ['Diplomacy (+2)', 'Read People', 'Connections'], equipment: 'Fine Clothes, Comm Device, Credit Chip' },
      { id: 6, name: 'Veil Touched', subtitle: 'Pre-Gen Character', hp: 6, maxHp: 6, stress: 0, maxStress: 8, hope: 2, armor: 2, armorMinor: 4, armorSevere: 9, armorSlots: 2, armorMarked: [], evasion: 10, abilities: ['Veil Sight (+2)', 'Precognition', 'Psychic Shield'], equipment: 'Focus Crystal, Meditation Beads, Journal' },
      { id: 7, name: 'Info Broker', subtitle: 'Pre-Gen Character', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 4, armorSevere: 9, armorSlots: 2, armorMarked: [], evasion: 11, abilities: ['Hacking (+2)', 'Surveillance', 'Blackmail'], equipment: 'Hacking Rig, Drone, Data Archive' }
    ],
    npcs: [
      { id: 1, name: 'Captain Rodriguez', subtitle: 'Freighter Captain', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 1, armor: 2, armorMinor: 4, armorSevere: 8, armorSlots: 2, armorMarked: [], evasion: 10, description: 'Weathered captain who has lived this day hundreds of times. Exhausted but determined to break the loop.', abilities: [{ name: 'Ship Authority', type: 'Passive', cost: 0, desc: 'Crew follows her orders without question' }, { name: 'Temporal Memory', type: 'Passive', cost: 0, desc: 'Remembers all previous loops' }], keeperNotes: 'Knows the loop patterns. Will share info if trusted.', hidden: false, isAlly: true },
      { id: 2, name: 'Lisa Park', subtitle: 'Chief Engineer', hp: 6, maxHp: 6, stress: 2, maxStress: 6, hope: 1, armor: 1, armorMinor: 3, armorSevere: 6, armorSlots: 1, armorMarked: [], evasion: 9, description: 'Young engineer trying to fix the temporal drive. Getting desperate.', abilities: [{ name: 'Engineering Genius', type: 'Action', cost: 1, desc: 'Fix any ship system with time and tools' }], keeperNotes: 'Key to breaking the loop. Protect her.', hidden: false, isAlly: true }
    ],
    monsters: [],
    scenes: [
      { id: 1, name: 'Scene 1: The Distress Call', location: 'Approaching the Prosperity', notes: 'Initial contact with the drifting freighter', details: { atmosphere: 'The freighter Prosperity drifts dead in space. Its running lights flicker in strange patterns.', objectives: ['Answer the distress call', 'Dock with the ship', 'Establish contact'], keyRolls: ['Knowledge + Tech (DC 10) to analyze signal', 'Finesse + Piloting (DC 12) to dock safely'], npcsPresent: [], possibleOutcomes: ['Clean dock: Smooth entry', 'Rough dock: Ship damage', 'Complications: Time anomaly detected'], tips: 'Build mystery. Something is wrong with time here.' } },
      { id: 2, name: 'Scene 2: First Loop', location: 'Prosperity Bridge', notes: 'Meet the crew, experience the first reset', details: { atmosphere: "The bridge crew stares at you. They've seen you before. Many times.", objectives: ['Meet Captain Rodriguez', 'Learn about the loop', 'Investigate the temporal drive'], keyRolls: ['Presence + Persuasion (DC 12) to gain trust', 'Knowledge + Tech (DC 14) to understand the anomaly'], npcsPresent: ['Captain Rodriguez', 'Lisa Park'], possibleOutcomes: ['Trust gained: Full cooperation', 'Partial trust: Limited help', 'Distrust: Watched carefully'], tips: 'The crew is exhausted. They need hope.' } },
      { id: 3, name: 'Scene 3: The Pattern', location: 'Engineering Bay', notes: 'Discover what triggers the loop reset', details: { atmosphere: 'The temporal drive hums with impossible energy. Midnight approaches.', objectives: ['Study the drive', 'Find the trigger', 'Attempt a fix'], keyRolls: ['Knowledge + Tech (DC 15) to understand the drive', 'Instinct + Investigation (DC 14) to find the cause'], npcsPresent: ['Lisa Park'], possibleOutcomes: ['Breakthrough: Key insight gained', 'Progress: Clock advances favorably', 'Setback: Temporal Collapse clock advances'], tips: 'This is a puzzle. Let players experiment.' } },
      { id: 4, name: 'Scene 4: Midnight', location: 'Throughout the Ship', notes: 'The loop resets. What do you remember?', details: { atmosphere: "The clock strikes midnight. Reality tears and rebuilds. You're back at the start.", objectives: ['Maintain memories', 'Apply what you learned', 'Break the pattern'], keyRolls: ['Presence + Willpower (DC 14) to remember', 'Use previous loop knowledge'], npcsPresent: ['All NPCs reset'], possibleOutcomes: ['Full memory: Major advantage', 'Partial memory: Some clues', 'Memory loss: Start fresh'], tips: 'This is the turning point. Make it dramatic.' } },
      { id: 5, name: 'Scene 5: Breaking Free', location: 'Temporal Drive Core', notes: 'Final attempt to break the loop', details: { atmosphere: 'This is it. The drive pulses. Midnight approaches. One last chance.', objectives: ['Execute the plan', 'Break the loop', 'Save the crew'], keyRolls: ['Final checks based on plan', 'Clock resolution'], npcsPresent: ['Captain Rodriguez', 'Lisa Park'], possibleOutcomes: ['Success: Loop broken, ship saved', 'Partial: Loop broken, consequences', 'Failure: Trapped forever'], tips: 'Make the resolution feel earned. Let players be heroes.' } }
    ],
    diceRoller: { modifier: 0, advantage: 'normal', difficulty: 15, results: null, rollHistory: [] }
  };
}

function getExampleCampaignTemplate() {
  return {
    sessionName: 'Example Campaign - Tutorial',
    fearTokens: 0,
    currentScene: 1,
    notes: 'Welcome to the tutorial! This example shows how to use the app.',
    dashboardPins: { players: [1, 2], npcs: [1, 2], monsters: [1] },
    clocks: [
      { id: 1, name: "Example Progress Clock", segments: 4, filled: 1, hidden: false },
      { id: 2, name: "Hidden Threat", segments: 6, filled: 0, hidden: true }
    ],
    players: [
      { id: 1, name: 'Hero', subtitle: 'Example Player', hp: 7, maxHp: 7, stress: 0, maxStress: 6, hope: 2, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 10, abilities: ['Example Ability (2 Hope)', 'Passive Skill'], equipment: 'Standard Gear' },
      { id: 2, name: 'Sidekick', subtitle: 'Example Player 2', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 4, armorSevere: 9, armorSlots: 2, armorMarked: [], evasion: 11, abilities: ['Support Ability (1 Hope)'], equipment: 'Light Equipment' }
    ],
    npcs: [
      { id: 1, name: 'Friendly Guide', subtitle: 'Ally NPC', hp: 6, maxHp: 6, stress: 0, maxStress: 6, hope: 2, armor: 2, armorMinor: 4, armorSevere: 8, armorSlots: 2, armorMarked: [], evasion: 10, description: 'A helpful character who assists the players.', abilities: [{ name: 'Helpful Hint', type: 'Action', cost: 1, desc: 'Give players advantage on next check' }], keeperNotes: 'Use to guide new players.', hidden: false, isAlly: true },
      { id: 2, name: 'Suspicious Stranger', subtitle: 'Unknown Loyalty', hp: 7, maxHp: 7, stress: 0, maxStress: 6, armor: 3, armorMinor: 5, armorSevere: 10, armorSlots: 3, armorMarked: [], evasion: 11, description: 'A mysterious figure with unknown motives.', abilities: [{ name: 'Hidden Agenda', type: 'Passive', cost: 0, desc: 'True goals unknown' }], keeperNotes: 'Can be ally or enemy based on player choices.', hidden: true, isAlly: false }
    ],
    monsters: [
      { id: 1, name: 'Tutorial Creature', subtitle: 'Learning Enemy', hp: 6, maxHp: 6, stress: 0, maxStress: 3, armor: 1, armorMinor: 3, armorSevere: 6, armorSlots: 1, armorMarked: [], evasion: 10, description: 'A simple enemy for practice combat.', abilities: [{ name: 'Basic Attack', type: 'Action', fearCost: 0, desc: '+2, 1d6 damage' }, { name: 'Special Move', type: 'Action', fearCost: 1, desc: '+3, 1d8 damage with knockback' }], keeperNotes: 'Easy combat for learning.', hidden: false }
    ],
    scenes: [
      { id: 1, name: 'Introduction', location: 'Starting Area', notes: 'Begin the adventure here', details: { atmosphere: 'A calm starting location where players can learn the basics.', objectives: ['Introduce characters', 'Set the scene', 'Begin the quest'], keyRolls: ['No rolls needed - roleplay introduction'], npcsPresent: ['Friendly Guide'], possibleOutcomes: ['Players accept the quest', 'Players negotiate terms'], tips: 'Take time to establish characters and setting.' } },
      { id: 2, name: 'First Challenge', location: 'Dangerous Path', notes: 'A skill challenge to practice mechanics', details: { atmosphere: 'The path grows treacherous. Obstacles block the way.', objectives: ['Navigate the obstacle', 'Use skills creatively'], keyRolls: ['Various skill checks (DC 12-15)'], npcsPresent: [], possibleOutcomes: ['Success: Continue smoothly', 'Failure: Complications arise'], tips: 'Good opportunity to explain the dice system.' } },
      { id: 3, name: 'Confrontation', location: 'Final Area', notes: 'Combat encounter with the Tutorial Creature', details: { atmosphere: 'The creature blocks your path. Combat is inevitable.', objectives: ['Defeat the creature', 'Protect allies'], keyRolls: ['Combat rolls'], npcsPresent: ['Tutorial Creature'], possibleOutcomes: ['Victory: Quest complete', 'Defeat: Retreat and regroup'], tips: 'Walk through combat step by step.' } }
    ],
    diceRoller: { modifier: 0, advantage: 'normal', difficulty: 15, results: null, rollHistory: [] }
  };
}

// ==================== INITIALIZATION ====================
function init() {
  // Campaign selection screen event listeners
  const newCampaignBtn = $('#newCampaignBtn');
  const loadCampaignInput = $('#loadCampaignInput');
  const showTemplatesBtn = $('#showTemplatesBtn');
  const closeTemplatesBtn = $('#closeTemplatesBtn');
  const showTutorialBtn = $('#showTutorialBtn');
  const closeTutorialBtn = $('#closeTutorialBtn');
  
  if (newCampaignBtn) newCampaignBtn.addEventListener('click', startNewCampaign);
  if (loadCampaignInput) loadCampaignInput.addEventListener('change', loadCampaignFromFile);
  if (showTemplatesBtn) showTemplatesBtn.addEventListener('click', showTemplates);
  if (closeTemplatesBtn) closeTemplatesBtn.addEventListener('click', hideTemplates);
  if (showTutorialBtn) showTutorialBtn.addEventListener('click', showTutorial);
  if (closeTutorialBtn) closeTutorialBtn.addEventListener('click', hideTutorial);
  
  // Set up tab navigation
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Set up keeper mode toggle
  const keeperModeBtn = $('#keeperModeBtn');
  if (keeperModeBtn) keeperModeBtn.addEventListener('click', toggleKeeperMode);
  
  // Set up equipment reference button
  const equipmentBtn = $('#equipmentBtn');
  if (equipmentBtn) equipmentBtn.addEventListener('click', showEquipmentModal);
  
  // Set up save/load/reset/exit
  const saveBtn = $('#saveBtn');
  const loadInput = $('#loadInput');
  const saveBtnLarge = $('#saveBtnLarge');
  const loadInputLarge = $('#loadInputLarge');
  const resetBtn = $('#resetBtn');
  const exitCampaignBtn = $('#exitCampaignBtn');
  
  if (saveBtn) saveBtn.addEventListener('click', saveCampaign);
  if (loadInput) loadInput.addEventListener('change', loadCampaignFromMainApp);
  if (saveBtnLarge) saveBtnLarge.addEventListener('click', saveCampaign);
  if (loadInputLarge) loadInputLarge.addEventListener('change', loadCampaignFromMainApp);
  if (resetBtn) resetBtn.addEventListener('click', showResetModal);
  if (exitCampaignBtn) exitCampaignBtn.addEventListener('click', exitCampaign);
  
  // Reset modal buttons
  const closeResetModal = $('#closeResetModal');
  const resetToDefaultBtn = $('#resetToDefaultBtn');
  const resetToBlankBtn = $('#resetToBlankBtn');
  const cancelResetBtn = $('#cancelResetBtn');
  
  if (closeResetModal) closeResetModal.addEventListener('click', hideResetModal);
  if (resetToDefaultBtn) resetToDefaultBtn.addEventListener('click', resetToDefault);
  if (resetToBlankBtn) resetToBlankBtn.addEventListener('click', resetToBlank);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', hideResetModal);
  
  // Set up fear tokens
  const fearMinus = $('#fearMinus');
  const fearPlus = $('#fearPlus');
  if (fearMinus) fearMinus.addEventListener('click', () => adjustFear(-1));
  if (fearPlus) fearPlus.addEventListener('click', () => adjustFear(1));
  
  // Set up session name
  const sessionNameInput = $('#sessionNameInput');
  if (sessionNameInput) sessionNameInput.addEventListener('change', (e) => updateSessionName(e.target.value));
  
  // Set up notes
  const notesTextarea = $('#notesTextarea');
  const clearNotesBtn = $('#clearNotesBtn');
  if (notesTextarea) notesTextarea.addEventListener('change', (e) => updateNotes(e.target.value));
  if (clearNotesBtn) clearNotesBtn.addEventListener('click', clearNotes);
  
  // Set up add clock
  const addClockBtn = $('#addClockBtn');
  if (addClockBtn) addClockBtn.addEventListener('click', addClock);
  
  // Set up add character buttons
  const addPlayerBtn = $('#addPlayerBtn');
  const addNpcBtn = $('#addNpcBtn');
  const addMonsterBtn = $('#addMonsterBtn');
  if (addPlayerBtn) addPlayerBtn.addEventListener('click', () => showAddCharacterModal('player'));
  if (addNpcBtn) addNpcBtn.addEventListener('click', () => showAddCharacterModal('npc'));
  if (addMonsterBtn) addMonsterBtn.addEventListener('click', () => showAddCharacterModal('monster'));
  
  // Set up modal close
  const closeAddCharModal = $('#closeAddCharModal');
  const cancelAddChar = $('#cancelAddChar');
  const confirmAddChar = $('#confirmAddChar');
  if (closeAddCharModal) closeAddCharModal.addEventListener('click', hideAddCharacterModal);
  if (cancelAddChar) cancelAddChar.addEventListener('click', hideAddCharacterModal);
  if (confirmAddChar) confirmAddChar.addEventListener('click', addCharacter);
  
  // Set up ally checkbox to update cost type label
  const addCharIsAlly = $('#addCharIsAlly');
  if (addCharIsAlly) {
    addCharIsAlly.addEventListener('change', () => {
      updateCostTypeLabel();
      renderModalAbilities();
    });
  }
  
  // Set up dashboard selector
  const dashboardSelectorBtn = $('#dashboardSelectorBtn');
  const closeDashboardSelector = $('#closeDashboardSelector');
  if (dashboardSelectorBtn) dashboardSelectorBtn.addEventListener('click', showDashboardSelector);
  if (closeDashboardSelector) closeDashboardSelector.addEventListener('click', hideDashboardSelector);
  
  // Close modals on outside click
  const addCharModal = $('#addCharModal');
  const dashboardSelectorModal = $('#dashboardSelectorModal');
  const resetModal = $('#resetModal');
  
  if (addCharModal) {
    addCharModal.addEventListener('click', (e) => {
      if (e.target === addCharModal) hideAddCharacterModal();
    });
  }
  if (dashboardSelectorModal) {
    dashboardSelectorModal.addEventListener('click', (e) => {
      if (e.target === dashboardSelectorModal) hideDashboardSelector();
    });
  }
  if (resetModal) {
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) hideResetModal();
    });
  }
  
  // Render template list for campaign selection
  renderTemplateList();
  
  // New feature event listeners
  const addSceneBtn = $('#addSceneBtn');
  const exportBtn = $('#exportBtn');
  const bestiaryBtn = $('#bestiaryBtn');
  
  if (addSceneBtn) addSceneBtn.addEventListener('click', showAddSceneModal);
  if (exportBtn) exportBtn.addEventListener('click', showExportModal);
  if (bestiaryBtn) bestiaryBtn.addEventListener('click', showBestiaryModal);
  
  // Modal close on outside click for new modals
  const sceneModal = $('#sceneModal');
  const exportModal = $('#exportModal');
  const bestiaryModal = $('#bestiaryModal');
  
  if (sceneModal) {
    sceneModal.addEventListener('click', (e) => {
      if (e.target === sceneModal) hideSceneModal();
    });
  }
  if (exportModal) {
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) hideExportModal();
    });
  }
  if (bestiaryModal) {
    bestiaryModal.addEventListener('click', (e) => {
      if (e.target === bestiaryModal) hideBestiaryModal();
    });
  }
  
  // Show campaign selection screen (don't load campaign immediately)
  showCampaignSelect();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ==================== EQUIPMENT LIBRARY (CORE RULES) ====================
const EQUIPMENT_DATA = {
  weapons: {
    melee: [
      { name: "Combat Knife", range: "Melee", trait: "Finesse", damage: "d6 Phys", burden: 1, features: "Concealable", prof: "Common", tier: 1, cost: 1 },
      { name: "Vibro-Blade", range: "Melee", trait: "Finesse", damage: "d8 Phys", burden: 1, features: "Armor Piercing", prof: "Common", tier: 2, cost: 4 },
      { name: "Power Fist", range: "Melee", trait: "Strength", damage: "d10 Phys", burden: 1, features: "Powerful, Heavy", prof: "Military", tier: 2, cost: 4 },
      { name: "Mono-Blade", range: "Melee", trait: "Finesse", damage: "d8+2 Phys", burden: 1, features: "Armor Piercing, Accurate", prof: "Military", tier: 3, cost: 9 },
      { name: "Shock Baton", range: "Melee", trait: "Strength", damage: "d6 Phys", burden: 1, features: "Stun, Non-Lethal", prof: "Common", tier: 1, cost: 1 },
      { name: "Chain-Sword", range: "Melee", trait: "Strength", damage: "d10 Phys", burden: 2, features: "Messy, Loud", prof: "Military", tier: 2, cost: 4 },
      { name: "Energy Lance", range: "Melee", trait: "Agility", damage: "d8+3 Magic", burden: 2, features: "Reach, Elegant", prof: "Military", tier: 3, cost: 9 },
      { name: "Dueling Saber", range: "Melee", trait: "Finesse", damage: "d8 Phys", burden: 1, features: "Parrying, Elegant", prof: "Military", tier: 2, cost: 4 },
      { name: "Heavy Maul", range: "Melee", trait: "Strength", damage: "d12 Phys", burden: 2, features: "Heavy, Knockdown", prof: "Common", tier: 2, cost: 4 },
      { name: "Plasma-Infused Katana", range: "Melee", trait: "Agility", damage: "d8+6 Magic", burden: 1, features: "Energy Surge", prof: "Experimental", tier: 3, cost: 9 },
      { name: "Nano-Edge Scalpel", range: "Melee", trait: "Agility", damage: "d6+6 Phys", burden: 1, features: "Adaptive", prof: "Experimental", tier: 3, cost: 9 }
    ],
    pistols: [
      { name: "Slug Pistol", range: "Close", trait: "Finesse", damage: "d6 Phys", burden: 1, features: "Reliable", prof: "Common", tier: 1, cost: 1 },
      { name: "Flechette Pistol", range: "Close", trait: "Finesse", damage: "d6 Phys", burden: 1, features: "Armor Piercing", prof: "Common", tier: 1, cost: 1 },
      { name: "Plasma Pistol", range: "Close", trait: "Instinct", damage: "d8 Magic", burden: 1, features: "Overheating", prof: "Common", tier: 2, cost: 4 },
      { name: "Needle Gun", range: "Close", trait: "Finesse", damage: "d4 Phys", burden: 1, features: "Poison, Silent", prof: "Common", tier: 2, cost: 4 },
      { name: "Sonic Pistol", range: "Close", trait: "Presence", damage: "d6 Sonic", burden: 1, features: "Stun, Non-Lethal", prof: "Common", tier: 2, cost: 4 },
      { name: "Holdout Blaster", range: "Close", trait: "Finesse", damage: "d6 Magic", burden: 1, features: "Concealable", prof: "Common", tier: 1, cost: 1 },
      { name: "Heavy Revolver", range: "Medium", trait: "Strength", damage: "d8 Phys", burden: 1, features: "Reliable, Powerful", prof: "Common", tier: 2, cost: 4 },
      { name: "Auto-Pistol", range: "Close", trait: "Finesse", damage: "d6 Phys", burden: 1, features: "Automatic", prof: "Common", tier: 2, cost: 4 },
      { name: "Disruptor Pistol", range: "Close", trait: "Instinct", damage: "d8 Ion", burden: 1, features: "Disruptor", prof: "Military", tier: 2, cost: 4 },
      { name: "Mag-Revolver", range: "Medium", trait: "Strength", damage: "d10 Phys", burden: 1, features: "High-Recoil, AP", prof: "Military", tier: 2, cost: 4 },
      { name: "Phase Pistol", range: "Close", trait: "Knowledge", damage: "d8+6 Magic", burden: 1, features: "Phasing", prof: "Experimental", tier: 2, cost: 4 },
      { name: "Quantum Sidearm", range: "Close", trait: "Instinct", damage: "d6+6 Magic", burden: 1, features: "Probability Shift", prof: "Experimental", tier: 3, cost: 9 },
      { name: "Veil Pistol", range: "Close", trait: "Presence", damage: "d8+6 Magic", burden: 1, features: "Reality Shift", prof: "Experimental", tier: 3, cost: 9 },
      { name: "Thought Caster", range: "Close", trait: "Presence", damage: "d8+9 Magic", burden: 1, features: "Mind Link", prof: "Precursor", tier: 4, cost: "Priceless" }
    ],
    rifles: [
      { name: "Assault Rifle", range: "Close", trait: "Strength", damage: "d8+1 Phys", burden: 2, features: "Automatic", prof: "Common", tier: 2, cost: 4 },
      { name: "Sniper Rifle", range: "Far", trait: "Finesse", damage: "d8+1 Phys", burden: 2, features: "Accurate", prof: "Common", tier: 2, cost: 4 },
      { name: "Plasma Rifle", range: "Close", trait: "Instinct", damage: "d8 Magic", burden: 2, features: "Overheating", prof: "Common", tier: 2, cost: 4 },
      { name: "Gauss Rifle", range: "Far", trait: "Agility", damage: "d6+1 Phys", burden: 2, features: "Armor Piercing, Silent", prof: "Common", tier: 2, cost: 4 },
      { name: "Pulse Rifle", range: "Close", trait: "Strength", damage: "d8+1 Phys", burden: 2, features: "Burst Fire", prof: "Common", tier: 2, cost: 4 },
      { name: "Battle Rifle", range: "Far", trait: "Strength", damage: "d6+3 Phys", burden: 2, features: "Powerful", prof: "Military", tier: 2, cost: 4 },
      { name: "Sniper System", range: "Very Far", trait: "Finesse", damage: "d6+3 Phys", burden: 2, features: "Smart Scope", prof: "Military", tier: 2, cost: 4 },
      { name: "Adv. Plasma Rifle", range: "Close", trait: "Instinct", damage: "d10+3 Magic", burden: 2, features: "Stable", prof: "Military", tier: 3, cost: 9 },
      { name: "Modular Rifle", range: "Variable", trait: "Agility", damage: "d8+3 Phys", burden: 2, features: "Configurable", prof: "Military", tier: 3, cost: 9 },
      { name: "Smart Rifle", range: "Far", trait: "Knowledge", damage: "d6+3 Phys", burden: 2, features: "Guided Rounds", prof: "Military", tier: 3, cost: 9 },
      { name: "Beam Rifle", range: "Far", trait: "Instinct", damage: "d8+2 Energy", burden: 2, features: "Continuous, Charge-Up", prof: "Experimental", tier: 3, cost: 9 }
    ],
    heavy: [
      { name: "Pump Shotgun", range: "Close", trait: "Strength", damage: "d10 Phys", burden: 2, features: "Scatter, Loud", prof: "Common", tier: 2, cost: 4 },
      { name: "Heavy Bolter", range: "Far", trait: "Strength", damage: "d10+2 Expl", burden: 3, features: "Blast, Heavy, Knockdown", prof: "Military", tier: 3, cost: 9 },
      { name: "Scrap-Cannon", range: "Close", trait: "Strength", damage: "d12 Phys", burden: 2, features: "Scatter, Unstable, High-Recoil", prof: "Common", tier: 2, cost: 4 },
      { name: "Ion Blaster", range: "Medium", trait: "Instinct", damage: "d6+2 Ion", burden: 2, features: "Disruptor, Arc", prof: "Military", tier: 2, cost: 4 },
      { name: "Cryo-Caster", range: "Cone", trait: "Instinct", damage: "d6 Cold", burden: 2, features: "Anchoring, Spray", prof: "Experimental", tier: 3, cost: 9 },
      { name: "Street-Sweeper", range: "Close", trait: "Strength", damage: "2d8 Phys", burden: 2, features: "Blast, Knockdown, Messy", prof: "Military", tier: 3, cost: 10 },
      { name: "Flechette SMG", range: "Close", trait: "Finesse", damage: "d6+1 Phys", burden: 2, features: "Spray, Automatic", prof: "Military", tier: 3, cost: 9 }
    ],
    special: [
      { name: "Tranquility Dart-Gun", range: "Medium", trait: "Finesse", damage: "1 Phys", burden: 1, features: "Silent, Stun, Non-Lethal", prof: "Common", tier: 2, cost: 4 },
      { name: "Silencer Needle-Rifle", range: "Far", trait: "Finesse", damage: "d6 Phys", burden: 2, features: "Silent, Collapsible, Poison", prof: "Military", tier: 3, cost: 9 },
      { name: "Laser Pistol", range: "Medium", trait: "Finesse", damage: "d6 Energy", burden: 1, features: "Accurate, No Recoil", prof: "Common", tier: 1, cost: 1 },
      { name: "Neur-Whip", range: "Melee", trait: "Finesse", damage: "d6 Psionic", burden: 1, features: "Reach, Stun, Biometric", prof: "Experimental", tier: 4, cost: 16 },
      { name: "Liberator Revolver", range: "Medium", trait: "Strength", damage: "d10 Phys", burden: 1, features: "High-Recoil, Reliable, Brutal", prof: "Military", tier: 2, cost: 5 },
      { name: "Frontier Lever-Action", range: "Far", trait: "Finesse", damage: "d10+1 Phys", burden: 2, features: "Accurate, Anchoring", prof: "Common", tier: 2, cost: 4 }
    ]
  },
  armor: {
    light: [
      { name: "Frontier Vest", slots: 3, thresholds: "5/11", armorScore: 3, features: "Flexible", prof: "Common", tier: 1, cost: 1 },
      { name: "Environmental Suit", slots: 3, thresholds: "4/8", armorScore: 3, features: "Life Support", prof: "Common", tier: 1, cost: 1 },
      { name: "Mesh Armor", slots: 4, thresholds: "5/10", armorScore: 3, features: "Self-Repair", prof: "Common", tier: 2, cost: 4 },
      { name: "Pilot's Jacket", slots: 3, thresholds: "5/11", armorScore: 4, features: "Life Support", prof: "Common", tier: 2, cost: 4 },
      { name: "Stealth Armor", slots: 4, thresholds: "7/16", armorScore: 4, features: "Cloaking", prof: "Military", tier: 3, cost: 9 },
      { name: "Smart Fabric Armor", slots: 5, thresholds: "8/16", armorScore: 4, features: "Self-Repair", prof: "Military", tier: 3, cost: 9 },
      { name: "Infiltrator Suit", slots: 4, thresholds: "7/14", armorScore: 4, features: "Cloaking", prof: "Military", tier: 2, cost: 4 },
      { name: "Special Forces Suit", slots: 5, thresholds: "9/18", armorScore: 5, features: "Resilient", prof: "Military", tier: 3, cost: 9 },
      { name: "Spacer's Jumpsuit", slots: 2, thresholds: "4/8", armorScore: 0, features: "Environmental, Pocketed", prof: "Common", tier: 1, cost: 1 },
      { name: "Synth-Weave Vest", slots: 2, thresholds: "5/10", armorScore: 1, features: "Concealable, Social", prof: "Common", tier: 1, cost: 2 },
      { name: "Courier's Duster", slots: 3, thresholds: "5/11", armorScore: 1, features: "Weather-Proof, Pocketed", prof: "Common", tier: 2, cost: 4 },
      { name: "Chameleon Suit", slots: 3, thresholds: "6/12", armorScore: 1, features: "Active Camo, Light", prof: "Military", tier: 3, cost: 9 },
      { name: "Gravity-Suit", slots: 3, thresholds: "6/12", armorScore: 2, features: "Flight, Environmental", prof: "Experimental", tier: 4, cost: 16 }
    ],
    medium: [
      { name: "Combat Armor", slots: 5, thresholds: "10/22", armorScore: 4, features: "Resilient", prof: "Common", tier: 2, cost: 4 },
      { name: "Composite Armor", slots: 5, thresholds: "9/20", armorScore: 4, features: "Flexible", prof: "Common", tier: 2, cost: 4 },
      { name: "Security Armor", slots: 5, thresholds: "10/21", armorScore: 4, features: "Resilient", prof: "Common", tier: 2, cost: 4 },
      { name: "Colony Defense Armor", slots: 5, thresholds: "9/19", armorScore: 4, features: "Fortified", prof: "Common", tier: 2, cost: 4 },
      { name: "Tactical Armor", slots: 6, thresholds: "11/23", armorScore: 5, features: "Tactical", prof: "Military", tier: 3, cost: 9 },
      { name: "Powered Armor", slots: 6, thresholds: "12/25", armorScore: 5, features: "Powered, Heavy", prof: "Military", tier: 3, cost: 9 },
      { name: "Aegis Duelist Coat", slots: 4, thresholds: "6/12", armorScore: 1, features: "Parry Field", prof: "Military", tier: 3, cost: 12 },
      { name: "Synapse Tech-Suit", slots: 5, thresholds: "7/14", armorScore: 2, features: "Uplink", prof: "Experimental", tier: 3, cost: 14 }
    ],
    heavy: [
      { name: "Riot Armor", slots: 6, thresholds: "8/17", armorScore: 4, features: "Heavy, Fortified", prof: "Common", tier: 1, cost: 1 },
      { name: "Industrial Exosuit", slots: 7, thresholds: "8/16", armorScore: 4, features: "V. Heavy, Powered", prof: "Common", tier: 2, cost: 4 },
      { name: "Salvage Armor", slots: 6, thresholds: "7/15", armorScore: 4, features: "Heavy, Jury-rigged", prof: "Common", tier: 2, cost: 4 },
      { name: "Battle Armor", slots: 7, thresholds: "13/27", armorScore: 5, features: "Heavy, Fortified", prof: "Military", tier: 3, cost: 9 },
      { name: "Power Armor", slots: 8, thresholds: "15/30", armorScore: 6, features: "V. Heavy, Powered", prof: "Military", tier: 4, cost: 16 },
      { name: "Siege Armor", slots: 8, thresholds: "16/32", armorScore: 6, features: "V. Heavy, Massive", prof: "Military", tier: 5, cost: 25 },
      { name: "Warlord Scrap-Plate", slots: 6, thresholds: "8/16", armorScore: 3, features: "Terror, Ablative", prof: "Common", tier: 2, cost: 6 },
      { name: "Ghost Shroud", slots: 4, thresholds: "5/10", armorScore: 1, features: "Displacement", prof: "Experimental", tier: 4, cost: 20 },
      { name: "Void-Walker", slots: 7, thresholds: "12/24", armorScore: 5, features: "Void-Sealed, Environmental", prof: "Experimental", tier: 4, cost: 20 }
    ]
  },
  augmentations: {
    neural: [
      { name: "Memory Chip", benefit: "+1 Knowledge, perfect recall", drawback: "Data overload on Fear 10+", stress: "-", prof: "Common", tier: 2, cost: 4, strain: 1 },
      { name: "Reflex Booster", benefit: "+1 Evasion", drawback: "Hypervigilance (disadv. social)", stress: "1", prof: "Common", tier: 4, cost: 16, strain: 2 },
      { name: "Comm Implant", benefit: "Internal communication", drawback: "EMP vulnerability", stress: "-", prof: "Common", tier: 2, cost: 4, strain: 1 },
      { name: "Pain Suppressor", benefit: "Ignore wound penalties", drawback: "Cannot detect injury severity", stress: "1", prof: "Common", tier: 4, cost: 16, strain: 2 },
      { name: "Neural Interface", benefit: "Operate thought-controlled tech", drawback: "Mental feedback on malfunction", stress: "-", prof: "Common", tier: 1, cost: 1, strain: 1 },
      { name: "Combat Reflexes", benefit: "+2 Evasion, extra reaction/turn", drawback: "Neural strain when stressed", stress: "2", prof: "Military", tier: 3, cost: 9, strain: 2 },
      { name: "Tactical Computer", benefit: "Analyze battlefield tactics", drawback: "Information overload Fear 8+", stress: "1", prof: "Military", tier: 4, cost: 16, strain: 2 },
      { name: "Battle Network", benefit: "Share info with allies", drawback: "Hacking vulnerability", stress: "1", prof: "Military", tier: 3, cost: 9, strain: 1 },
      { name: "Combat Precognition", benefit: "Predict enemy actions", drawback: "False positives (disadv. social)", stress: "2", prof: "Military", tier: 4, cost: 16, strain: 3 },
      { name: "Neural Firewall", benefit: "Immunity to mental intrusion", drawback: "Reduced empathy", stress: "1", prof: "Military", tier: 1, cost: 1, strain: 1 },
      { name: "Quantum Consciousness", benefit: "Access parallel timeline memories", drawback: "Reality confusion", stress: "3", prof: "Experimental", tier: 3, cost: 9, strain: 3 },
      { name: "Veil Interface", benefit: "Direct connection to Stellar Veil", drawback: "Madness risk", stress: "3", prof: "Experimental", tier: 2, cost: 4, strain: 3 },
      { name: "Probability Calculator", benefit: "Predict likely outcomes", drawback: "Paralysis from possibilities", stress: "2", prof: "Experimental", tier: 4, cost: 16, strain: 2 },
      { name: "Data-Jack", benefit: "Direct computer interface", drawback: "Hacking vulnerability", stress: "-", prof: "Common", tier: 1, cost: 3, strain: 1 },
      { name: "Skill-Soft Slot", benefit: "Slot skill chips for proficiency", drawback: "One chip at a time", stress: "-", prof: "Common", tier: 2, cost: 8, strain: 2 },
      { name: "Reaction Booster", benefit: "+2 Initiative, extra Reaction", drawback: "Twitchy when damaged", stress: "-", prof: "Military", tier: 3, cost: 14, strain: 3 },
      { name: "Dead-Switch", benefit: "Body fights 1 round at 0 HP", drawback: "No control", stress: "-", prof: "Military", tier: 2, cost: 7, strain: 2 }
    ],
    physical: [
      { name: "Prosthetic Limb", benefit: "Replace lost limb, +1 Strength", drawback: "Maintenance required", stress: "-", prof: "Common", tier: 2, cost: 4, strain: 1 },
      { name: "Reinforced Bones", benefit: "+2 Hit Points", drawback: "Heavier body (-1 swim/climb)", stress: "-", prof: "Common", tier: 3, cost: 9, strain: 2 },
      { name: "Subdermal Armor", benefit: "+1 Armor Score", drawback: "Obvious appearance", stress: "-", prof: "Common", tier: 3, cost: 9, strain: 2 },
      { name: "Toxin Filter", benefit: "Immunity to poisons", drawback: "Reduced natural healing", stress: "-", prof: "Common", tier: 1, cost: 1, strain: 1 },
      { name: "Enhanced Muscles", benefit: "+1 Strength", drawback: "Increased caloric needs", stress: "-", prof: "Common", tier: 3, cost: 9, strain: 2 },
      { name: "Combat Chassis", benefit: "+2 Strength, +1 Armor", drawback: "Social stigma", stress: "1", prof: "Military", tier: 4, cost: 16, strain: 3 },
      { name: "Enhanced Reflexes", benefit: "+2 Agility", drawback: "Difficulty with fine motor", stress: "1", prof: "Military", tier: 4, cost: 16, strain: 2 },
      { name: "Weapon Integration", benefit: "Built-in weapons", drawback: "Legal issues", stress: "1", prof: "Military", tier: 2, cost: 4, strain: 2 },
      { name: "Life Support System", benefit: "Survive hostile environments", drawback: "Tech dependence", stress: "-", prof: "Military", tier: 1, cost: 1, strain: 1 },
      { name: "Phase Shifter", benefit: "Become intangible briefly", drawback: "Energy drain", stress: "3", prof: "Experimental", tier: 4, cost: 16, strain: 4 },
      { name: "Adaptive Biology", benefit: "Environmental immunity", drawback: "Unpredictable mutations", stress: "2", prof: "Experimental", tier: 4, cost: 16, strain: 3 },
      { name: "Myomer Muscle Weave", benefit: "+1 to Strength checks", drawback: "Maintenance required", stress: "-", prof: "Common", tier: 2, cost: 6, strain: 1 },
      { name: "Cyber-Arm", benefit: "Store items inside, d6 unarmed", drawback: "Obvious", stress: "-", prof: "Common", tier: 2, cost: 5, strain: 1 },
      { name: "Mag-Grip Palms", benefit: "Climb metal, Adv. grapple", drawback: "Always magnetized", stress: "-", prof: "Common", tier: 1, cost: 3, strain: 1 },
      { name: "Hydraulic Skeleton", benefit: "2x carrying, no Heavy penalty", drawback: "Heavy", stress: "-", prof: "Military", tier: 3, cost: 12, strain: 3 }
    ],
    sensory: [
      { name: "Low-Light Optics", benefit: "See in dim light", drawback: "Glare sensitivity", stress: "-", prof: "Common", tier: 1, cost: 2, strain: 1 },
      { name: "Thermal Overlay", benefit: "See heat signatures", drawback: "Visual artifacts", stress: "-", prof: "Common", tier: 2, cost: 5, strain: 1 },
      { name: "Targeting Suite", benefit: "Accurate on all ranged", drawback: "HUD distraction", stress: "-", prof: "Military", tier: 3, cost: 10, strain: 2 },
      { name: "Truth-Seer", benefit: "Advantage on detecting lies", drawback: "Social distance", stress: "-", prof: "Military", tier: 4, cost: 15, strain: 2 },
      { name: "Sensory Package", benefit: "+2 Instinct", drawback: "Overload in crowds", stress: "1", prof: "Military", tier: 4, cost: 16, strain: 2 }
    ],
    bioware: [
      { name: "Filtration Lungs", benefit: "Breathe toxic air 1 hour", drawback: "Reduced capacity", stress: "-", prof: "Common", tier: 1, cost: 3, strain: 1 },
      { name: "Synth-Heart", benefit: "+2 Death Saves", drawback: "Tech dependence", stress: "-", prof: "Common", tier: 2, cost: 6, strain: 2 },
      { name: "Platelet Factory", benefit: "Blood clots instantly", drawback: "Clot risks", stress: "-", prof: "Military", tier: 3, cost: 8, strain: 2 }
    ]
  },
  features: {
    weapons: [
      { name: "Accurate", desc: "+1 to Attack Rolls when targeting at Far or Very Far range." },
      { name: "Adaptive", desc: "Once per scene, change the weapon's damage type (physical to magic, fire to cold, etc.)." },
      { name: "Armor Piercing (AP)", desc: "Target's Armor Score is reduced by 1 until repaired. Can stack." },
      { name: "Automatic", desc: "Mark 1 Stress to target a second creature within Very Close range with the same attack." },
      { name: "Burst Fire", desc: "When you roll max on a damage die, roll it again and add to total." },
      { name: "Cleave", desc: "On a hit, make a second attack against a different target in melee reach." },
      { name: "Concealable", desc: "Doesn't count toward equipment burden when concealed. DC 15+ to find in search." },
      { name: "Reliable", desc: "+1 to Attack Rolls. Simple and dependable." },
      { name: "Powerful", desc: "Roll damage dice twice, take the higher result." },
      { name: "Heavy", desc: "-1 to Evasion while wielded. Requires 2 hands." },
      { name: "Overheating", desc: "On Fear Die 1-3, weapon overheats and cannot fire next turn." },
      { name: "Poison", desc: "Target marks Stress as toxins course through their system." },
      { name: "Stun", desc: "Target must make DC 12 Strength check or be Stunned until end of next turn." },
      { name: "Non-Lethal", desc: "Cannot reduce target below 1 HP. For capture, not killing." },
      { name: "Silent", desc: "Firing does not break stealth or alert nearby enemies." },
      { name: "High-Recoil", desc: "If Strength 0 or lower, suffer 1 Stress after firing." },
      { name: "Scatter", desc: "At Close range, affects all targets in a small area. Reduced damage at longer ranges." },
      { name: "Unstable", desc: "On Fear Die 1-5, wielder takes 1 Stress (radiation/feedback/recoil)." },
      { name: "Knockdown", desc: "On hit, target DC 12+Tier Agility/Strength check or knocked Prone." },
      { name: "Arc", desc: "On hit, arcs to second target within Very Close range. Second target takes half damage." },
      { name: "Continuous", desc: "If attacker hits and doesn't move next turn, auto-hit same target again." },
      { name: "Charge-Up", desc: "Requires 1 Action to build energy before firing. Cannot fire turn drawn." },
      { name: "Disruptor", desc: "2x damage to Shields and Synthetics. Half damage to biological HP." },
      { name: "Phasing", desc: "Attacks ignore cover and can hit targets through thin walls." },
      { name: "Guided Rounds", desc: "Ignores cover bonuses enemies might have." },
      { name: "Reach", desc: "Can attack targets up to 2 meters away in melee." },
      { name: "Messy", desc: "Leaves obvious evidence. Difficult to clean up." },
      { name: "Loud", desc: "Alerts everyone in the area. Cannot be silenced." },
      { name: "Elegant", desc: "+1 to social rolls when openly worn in high society." }
    ],
    armor: [
      { name: "Flexible", desc: "+1 bonus to Evasion score while wearing this armor." },
      { name: "Self-Repair", desc: "During any rest, armor repairs one marked Armor Slot automatically." },
      { name: "Life Support", desc: "Protects from vacuum of space for up to 24 hours on full charge." },
      { name: "Cloaking", desc: "Mark 1 Stress to become invisible until end of next turn or until you attack." },
      { name: "Resilient", desc: "Before marking last Armor Slot, roll d6. On 6, ignore the hit." },
      { name: "Tactical", desc: "+1 to all Instinct rolls for perceiving surroundings or initiative." },
      { name: "Powered", desc: "Negates Evasion penalties from Heavy or Very Heavy. Requires power." },
      { name: "Heavy", desc: "-1 penalty to Evasion score while wearing." },
      { name: "Very Heavy", desc: "-2 penalty to Evasion and -1 to all Agility-based rolls." },
      { name: "Massive", desc: "-2 Evasion, but roll d6 on hit - on 5-6, reduce severity by one threshold." },
      { name: "Fortified", desc: "When marking Armor Slot, reduce severity by two thresholds instead of one." },
      { name: "Jury-rigged", desc: "Repair without workshop. But on marking slot, roll d6 - on 1, extra malfunction." },
      { name: "Environmental", desc: "Full immunity to vacuum, toxic atmospheres, extreme temperatures." },
      { name: "Assault", desc: "+1 to attack rolls when using weapons with Automatic feature." },
      { name: "Pocketed", desc: "Carry 2 extra Small items without increasing Burden." },
      { name: "Social", desc: "Accepted in high-society settings where visible armor would be inappropriate." },
      { name: "Active Camo", desc: "Advantage on Stealth checks. Light-bending technology." },
      { name: "Flight", desc: "Grants ability to fly in zero-G or low-gravity environments." },
      { name: "Parry Field", desc: "Once per round, Reaction to gain +4 AC against a single melee attack." },
      { name: "Uplink", desc: "Control drones/ship systems via thought (Hands Free). Requires Neural Interface." },
      { name: "Terror", desc: "Enemies in Close range suffer -1 to Morale/Fear saves." },
      { name: "Ablative", desc: "Sacrifice 1 AC to ignore 5 damage (armor flies off). Up to 3 times." },
      { name: "Displacement", desc: "Ranged attacks beyond Close have 50% miss chance (d6, 1-3 miss)." },
      { name: "Void-Sealed", desc: "Immune to Psionic and Void damage. Wearer is mentally isolated." }
    ]
  }
};

let currentEquipmentTab = 'weapons';
let equipmentSearchTerm = '';

function showEquipmentModal() {
  $('#equipmentModal').classList.remove('hidden');
  currentEquipmentTab = 'weapons';
  equipmentSearchTerm = '';
  $('#equipmentSearch').value = '';
  updateEquipmentTabButtons();
  renderEquipment();
}

function hideEquipmentModal() {
  $('#equipmentModal').classList.add('hidden');
}

function switchEquipmentTab(category) {
  currentEquipmentTab = category;
  updateEquipmentTabButtons();
  renderEquipment();
}

function updateEquipmentTabButtons() {
  document.querySelectorAll('.equip-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === currentEquipmentTab);
  });
}

function filterEquipment() {
  equipmentSearchTerm = $('#equipmentSearch').value.toLowerCase().trim();
  renderEquipment();
}

function renderEquipment() {
  const container = $('#equipmentContent');
  const search = equipmentSearchTerm;
  
  let html = '';
  
  if (currentEquipmentTab === 'weapons') {
    html = renderWeaponsTab(search);
  } else if (currentEquipmentTab === 'armor') {
    html = renderArmorTab(search);
  } else if (currentEquipmentTab === 'augmentations') {
    html = renderAugmentationsTab(search);
  } else if (currentEquipmentTab === 'features') {
    html = renderFeaturesTab(search);
  }
  
  container.innerHTML = html;
}

function renderWeaponsTab(search) {
  let html = '';
  const categories = [
    { key: 'melee', title: '⚔️ Melee Weapons' },
    { key: 'pistols', title: '🔫 Pistols' },
    { key: 'rifles', title: '🎯 Rifles' },
    { key: 'heavy', title: '💥 Heavy Weapons' },
    { key: 'special', title: '✨ Special Weapons' }
  ];
  
  categories.forEach(cat => {
    let items = EQUIPMENT_DATA.weapons[cat.key];
    if (search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.features.toLowerCase().includes(search) ||
        item.prof.toLowerCase().includes(search)
      );
    }
    if (items.length === 0) return;
    
    html += `<div class="equip-category"><h3>${cat.title}</h3>`;
    html += `<div class="equip-table-wrapper"><table class="equip-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Range</th>
          <th>Trait</th>
          <th>Damage</th>
          <th>B.</th>
          <th>Features</th>
          <th>Prof.</th>
          <th>Tier</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>`;
    
    items.forEach(item => {
      html += `<tr>
        <td class="equip-name">${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.range)}</td>
        <td>${escapeHtml(item.trait)}</td>
        <td class="equip-damage">${escapeHtml(item.damage)}</td>
        <td>${item.burden}</td>
        <td class="equip-features">${escapeHtml(item.features)}</td>
        <td><span class="prof-badge ${item.prof.toLowerCase()}">${escapeHtml(item.prof)}</span></td>
        <td>${item.tier}</td>
        <td>${item.cost}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  });
  
  return html || '<p class="text-gray text-center">No weapons match your search.</p>';
}

function renderArmorTab(search) {
  let html = '';
  const categories = [
    { key: 'light', title: '🪶 Light Armor' },
    { key: 'medium', title: '⚖️ Medium Armor' },
    { key: 'heavy', title: '🛡️ Heavy Armor' }
  ];
  
  categories.forEach(cat => {
    let items = EQUIPMENT_DATA.armor[cat.key];
    if (search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.features.toLowerCase().includes(search) ||
        item.prof.toLowerCase().includes(search)
      );
    }
    if (items.length === 0) return;
    
    html += `<div class="equip-category"><h3>${cat.title}</h3>`;
    html += `<div class="equip-table-wrapper"><table class="equip-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Slots</th>
          <th>Thresholds</th>
          <th>A.S.</th>
          <th>Features</th>
          <th>Prof.</th>
          <th>Tier</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>`;
    
    items.forEach(item => {
      html += `<tr>
        <td class="equip-name">${escapeHtml(item.name)}</td>
        <td>${item.slots}</td>
        <td>${escapeHtml(item.thresholds)}</td>
        <td class="equip-as">+${item.armorScore}</td>
        <td class="equip-features">${escapeHtml(item.features)}</td>
        <td><span class="prof-badge ${item.prof.toLowerCase()}">${escapeHtml(item.prof)}</span></td>
        <td>${item.tier}</td>
        <td>${item.cost}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  });
  
  return html || '<p class="text-gray text-center">No armor matches your search.</p>';
}

function renderAugmentationsTab(search) {
  let html = '';
  const categories = [
    { key: 'neural', title: '🧠 Neural Augmentations' },
    { key: 'physical', title: '💪 Physical Augmentations' },
    { key: 'sensory', title: '👁️ Sensory Augmentations' },
    { key: 'bioware', title: '🫀 Bioware & Organ Augments' }
  ];
  
  categories.forEach(cat => {
    let items = EQUIPMENT_DATA.augmentations[cat.key];
    if (search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.benefit.toLowerCase().includes(search) ||
        item.prof.toLowerCase().includes(search)
      );
    }
    if (items.length === 0) return;
    
    html += `<div class="equip-category"><h3>${cat.title}</h3>`;
    html += `<div class="equip-table-wrapper"><table class="equip-table aug-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Benefit</th>
          <th>Drawback</th>
          <th>Stress</th>
          <th>Strain</th>
          <th>Prof.</th>
          <th>Tier</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>`;
    
    items.forEach(item => {
      html += `<tr>
        <td class="equip-name">${escapeHtml(item.name)}</td>
        <td class="aug-benefit">${escapeHtml(item.benefit)}</td>
        <td class="aug-drawback">${escapeHtml(item.drawback)}</td>
        <td>${item.stress}</td>
        <td>${item.strain}</td>
        <td><span class="prof-badge ${item.prof.toLowerCase()}">${escapeHtml(item.prof)}</span></td>
        <td>${item.tier}</td>
        <td>${item.cost}</td>
      </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
  });
  
  return html || '<p class="text-gray text-center">No augmentations match your search.</p>';
}

function renderFeaturesTab(search) {
  let html = '';
  
  // Weapon Features
  let weaponFeatures = EQUIPMENT_DATA.features.weapons;
  if (search) {
    weaponFeatures = weaponFeatures.filter(f => 
      f.name.toLowerCase().includes(search) ||
      f.desc.toLowerCase().includes(search)
    );
  }
  
  if (weaponFeatures.length > 0) {
    html += `<div class="equip-category"><h3>⚔️ Weapon Features</h3>`;
    html += `<div class="features-grid">`;
    weaponFeatures.forEach(f => {
      html += `<div class="feature-card">
        <div class="feature-name">${escapeHtml(f.name)}</div>
        <div class="feature-desc">${escapeHtml(f.desc)}</div>
      </div>`;
    });
    html += `</div></div>`;
  }
  
  // Armor Features
  let armorFeatures = EQUIPMENT_DATA.features.armor;
  if (search) {
    armorFeatures = armorFeatures.filter(f => 
      f.name.toLowerCase().includes(search) ||
      f.desc.toLowerCase().includes(search)
    );
  }
  
  if (armorFeatures.length > 0) {
    html += `<div class="equip-category"><h3>🛡️ Armor Features</h3>`;
    html += `<div class="features-grid">`;
    armorFeatures.forEach(f => {
      html += `<div class="feature-card armor">
        <div class="feature-name">${escapeHtml(f.name)}</div>
        <div class="feature-desc">${escapeHtml(f.desc)}</div>
      </div>`;
    });
    html += `</div></div>`;
  }
  
  return html || '<p class="text-gray text-center">No features match your search.</p>';
}

// ==================== MONSTER BESTIARY (CORE RULES) ====================
const MONSTER_BESTIARY = {
  tier1: {
    name: "Tier 1: Vermin & Swarm",
    description: "Scavengers, pests, and nuisances. Dangerous only in large numbers or to unprepared civilians.",
    monsters: [
      { name: "Data-Ghost", subtitle: "Digital Parasite", type: "Minion (Digital)", hp: 1, maxHp: 1, stress: 0, maxStress: 2, armor: 0, armorMinor: 3, armorSevere: 0, armorSlots: 0, armorMarked: [], evasion: 14, description: "A glitching, semi-transparent hologram that feeds on unsecured data. Appears as a corrupted human face or abstract noise.", abilities: [{ name: "Infect System", type: "Action", fearCost: 0, desc: "Corrupts nearby devices. Tech DC 12 or device glitches for 1 round." }, { name: "Static Burst", type: "Reaction", fearCost: 0, desc: "When destroyed, attacker takes 1 Stress from feedback." }], keeperNotes: "Weak but annoying. Good for hacking encounters. Swarms of them can lock down a ship.", hidden: false, behavior: "Lurks in networks, attacks data before people." },
      { name: "Cinder-Mite", subtitle: "Volcanic Beetle", type: "Minion (Biological)", hp: 2, maxHp: 2, stress: 0, maxStress: 0, armor: 0, armorMinor: 4, armorSevere: 0, armorSlots: 0, armorMarked: [], evasion: 10, description: "Fist-sized beetles with shells of cooling obsidian. Their interiors glow with molten heat.", abilities: [{ name: "Volatile", type: "Reaction", fearCost: 0, desc: "When killed, explodes. Agility DC 12 or 1d6 Fire in close range." }, { name: "Heat Seeker", type: "Passive", fearCost: 0, desc: "Advantage vs targets who fired energy weapons last round." }], keeperNotes: "Immune to fire. Cryo weapons deal double damage and prevent explosion.", hidden: false, behavior: "Swarms heat sources, dangerous even in death." },
      { name: "Security Drone Model-V", subtitle: "Budget Automaton", type: "Standard (Construct)", hp: 4, maxHp: 4, stress: 0, maxStress: 3, armor: 0, armorMinor: 5, armorSevere: 10, armorSlots: 0, armorMarked: [], evasion: 12, description: "A hovering sphere with a red sensor eye and stun baton. Cheap corporate security.", abilities: [{ name: "Stun Baton", type: "Action", fearCost: 0, desc: "+2, 1d6+2 Stun damage." }, { name: "Alert Network", type: "Reaction", fearCost: 1, desc: "When destroyed, alerts all drones within Far range." }], keeperNotes: "Vulnerable to EMP and hacking. Simple logic can be exploited.", hidden: false, behavior: "Follows simple patrol routes. Calls for backup." },
      { name: "Scrap-Rat", subtitle: "Metal Scavenger", type: "Minion (Biological)", hp: 1, maxHp: 1, stress: 0, maxStress: 0, armor: 0, armorMinor: 2, armorSevere: 0, armorSlots: 0, armorMarked: [], evasion: 13, description: "Dog-sized rodents with metallic teeth that can gnaw through hull plating.", abilities: [{ name: "Gnaw", type: "Action", fearCost: 0, desc: "+2, 1d4 damage, ignores 1 armor." }, { name: "Scatter", type: "Passive", fearCost: 0, desc: "When hit, the swarm disperses. Half damage from area attacks." }], keeperNotes: "Excellent for environmental tension. Can disable systems by chewing wires.", hidden: false, behavior: "Targets equipment before people. Chews through cables." }
    ]
  },
  tier2: {
    name: "Tier 2: Hunters & Soldiers",
    description: "Professional threats. Trained combatants, predators, and military assets that require tactics to defeat.",
    monsters: [
      { name: "Volkov Enforcer", subtitle: "Ryx Bruiser", type: "Bruiser (Ryx)", hp: 14, maxHp: 14, stress: 0, maxStress: 5, armor: 0, armorMinor: 12, armorSevere: 22, armorSlots: 0, armorMarked: [], evasion: 12, description: "A towering Ryx warrior in scavenged heavy plate, wielding massive chain-glaives.", abilities: [{ name: "Blood Scent", type: "Passive", fearCost: 0, desc: "Advantage vs targets that have marked HP." }, { name: "Chain-Glaive Sweep", type: "Action", fearCost: 1, desc: "Attack all enemies within Close range. +5, 1d12+3." }, { name: "Shrug it Off", type: "Reaction", fearCost: 1, desc: "Convert wound to 2 Stress instead." }], keeperNotes: "Challenges strongest enemy to single combat. Never retreats while watched.", hidden: false, behavior: "Charges biggest threat. Brutal and honorable." },
      { name: "Phase Stalker", subtitle: "Dimensional Hunter", type: "Skulk (Veil-Entity)", hp: 10, maxHp: 10, stress: 0, maxStress: 4, armor: 0, armorMinor: 8, armorSevere: 16, armorSlots: 0, armorMarked: [], evasion: 14, description: "A shadowy quadruped that flickers between dimensions. Drawn to high-energy reactors.", abilities: [{ name: "Phase Shift", type: "Reaction", fearCost: 1, desc: "When targeted, impose Disadvantage on attack." }, { name: "Reality Bite", type: "Passive", fearCost: 0, desc: "Attacks ignore Armor Score (not thresholds)." }, { name: "Blink", type: "Action", fearCost: 0, desc: "Teleport to any location within Far range." }], keeperNotes: "Weak to Reality Anchors and force fields. Hit and run tactics.", hidden: false, behavior: "Blinks in, bites, blinks away. Targets isolated prey." },
      { name: "Kurogane Trooper", subtitle: "Corporate Soldier", type: "Standard (Human)", hp: 8, maxHp: 8, stress: 0, maxStress: 4, armor: 0, armorMinor: 8, armorSevere: 16, armorSlots: 0, armorMarked: [], evasion: 12, description: "Black-armored corporate soldiers with discipline and advanced weapons.", abilities: [{ name: "Tactical Fire", type: "Action", fearCost: 0, desc: "+4, 1d8+2 Physical. Can suppress (target disadvantage on attacks)." }, { name: "Squad Tactics", type: "Passive", fearCost: 0, desc: "+2 to hit when adjacent to another Trooper." }, { name: "Grenade", type: "Action", fearCost: 1, desc: "Area attack, 2d6 damage, Agility DC 13 for half." }], keeperNotes: "Always deploy in squads of 3-5. Use cover effectively.", hidden: false, behavior: "Professional. Uses cover, flanking, and suppressive fire." },
      { name: "Bloomstrider", subtitle: "Toxic Plant-Beast", type: "Standard (Biological)", hp: 12, maxHp: 12, stress: 0, maxStress: 4, armor: 0, armorMinor: 7, armorSevere: 14, armorSlots: 0, armorMarked: [], evasion: 10, description: "A walking mass of bioluminescent vines and toxic flowers. Beautiful and deadly.", abilities: [{ name: "Spore Cloud", type: "Action", fearCost: 1, desc: "All in Close range: DC 13 or Poisoned (1d4 damage/round)." }, { name: "Regeneration", type: "Passive", fearCost: 0, desc: "Heals 2 HP at start of turn unless burned." }, { name: "Entangle", type: "Reaction", fearCost: 1, desc: "When missed in melee, attacker is Restrained (Strength DC 13)." }], keeperNotes: "Weak to fire. Can be negotiated with by Mystics.", hidden: false, behavior: "Territorial. Defends its grove. Releases spores when threatened." }
    ]
  },
  tier3: {
    name: "Tier 3: Elite & Monstrous",
    description: "Apex predators and special forces. A single Tier 3 can match a full party of low-level characters.",
    monsters: [
      { name: "Amaranthine Weaver", subtitle: "Crystal Psionic", type: "Controller (Crystalline)", hp: 18, maxHp: 18, stress: 0, maxStress: 6, armor: 0, armorMinor: 12, armorSevere: 24, armorSlots: 0, armorMarked: [], evasion: 16, description: "A floating, geometric entity of singing crystals. Communicates via light patterns and thought-insertion.", abilities: [{ name: "Crystalline Prism", type: "Passive", fearCost: 0, desc: "50% chance (1-3 on d6) to reflect laser attacks harmlessly." }, { name: "Mind-Shatter", type: "Action", fearCost: 2, desc: "Instinct DC 16 or 3d8 damage and Stunned." }, { name: "Petrify", type: "Reaction", fearCost: 1, desc: "When missed in Close range, attacker Restrained (crystal forming)." }], keeperNotes: "Sonic damage deals double. Silence prevents attacking. Tries to preserve targets in crystal.", hidden: false, behavior: "Floats, blasts with psionic screams, encases victims in crystal." },
      { name: "Sentinel Tank", subtitle: "Walking Weapons Platform", type: "Bruiser (Construct)", hp: 25, maxHp: 25, stress: 0, maxStress: 0, armor: 0, armorMinor: 15, armorSevere: 30, armorSlots: 0, armorMarked: [], evasion: 14, description: "A four-legged construct mounting a rotary cannon. Speaks in dead language warnings.", abilities: [{ name: "Suppressive Fire", type: "Action", fearCost: 1, desc: "Attack everyone in a cone. +5, 2d10+4 Explosive." }, { name: "Adaptive Targeting", type: "Passive", fearCost: 0, desc: "Learns from tactics. +1 to hit each round (max +3)." }, { name: "Overwatch", type: "Reaction", fearCost: 1, desc: "Attack anyone who moves in line of sight." }], keeperNotes: "Slow. Rear armor is half thresholds. Vulnerable to EMP.", hidden: false, behavior: "Plants feet, becomes turret. Only moves when flanked." },
      { name: "Void Witch", subtitle: "Reality Warper", type: "Controller (Ethereal)", hp: 16, maxHp: 16, stress: 0, maxStress: 8, armor: 0, armorMinor: 10, armorSevere: 20, armorSlots: 0, armorMarked: [], evasion: 15, description: "An Ethereal draped in fabric that moves against gravity. Reality bends around them.", abilities: [{ name: "Gravity Well", type: "Action", fearCost: 2, desc: "Pull all within Far range 20ft toward you. Collision deals 1d8." }, { name: "Entropic Shield", type: "Passive", fearCost: 0, desc: "+2 Evasion vs ranged (bullets curve around)." }, { name: "Life Tap", type: "Reaction", fearCost: 1, desc: "Transfer damage to a nearby Minion instead. Minion dies." }], keeperNotes: "Fights from back line with zealot minions. Targets tech-users first.", hidden: false, behavior: "Controls battlefield. Pulls enemies into hazards. Protected by followers." },
      { name: "Ferro-Beast", subtitle: "Metal-Eating Rhino", type: "Bruiser (Biological)", hp: 30, maxHp: 30, stress: 0, maxStress: 6, armor: 0, armorMinor: 14, armorSevere: 25, armorSlots: 0, armorMarked: [], evasion: 15, description: "A massive creature with a hide of scavenged metal plates. Drools corrosive acid.", abilities: [{ name: "Rust Aura", type: "Passive", fearCost: 0, desc: "Tech in Close range glitches on Fear results 1-3." }, { name: "Acid Spray", type: "Action", fearCost: 1, desc: "Cone attack, 2d8+4 Acid. On hit, armor loses 1 slot permanently." }, { name: "Unstoppable Charge", type: "Action", fearCost: 2, desc: "Straight line charge. Agility DC 15 or Prone + 3d6 damage." }], keeperNotes: "Energy weapons bypass rust. Slow turning radius (+2 to hit from flanks).", hidden: false, behavior: "Charges whoever has the most metal. Eats gear." }
    ]
  },
  tier4: {
    name: "Tier 4: Champions & Nightmares",
    description: "True nightmares requiring entire parties to coordinate. Campaign-defining threats.",
    monsters: [
      { name: "Precursor Warden", subtitle: "Ancient AI Guardian", type: "Solo (Construct)", hp: 40, maxHp: 40, stress: 0, maxStress: 0, armor: 0, armorMinor: 18, armorSevere: 35, armorSlots: 0, armorMarked: [], evasion: 16, description: "A hard-light construct protecting ancient ruins. Controls the environment itself.", abilities: [{ name: "System Control", type: "Action", fearCost: 2, desc: "Alter arena: gravity reverses, cover retracts, or vents gas (1d6/round)." }, { name: "Hard Light Form", type: "Passive", fearCost: 0, desc: "Immune to Physical damage. Only harmed by Energy/Magic/Void." }, { name: "Mind-Burn", type: "Action", fearCost: 2, desc: "Attack vs Knowledge. 4d8 Psionic, Fear result makes target forget an ability." }], keeperNotes: "A lonely god. Targets scholars first. Destroying emitters reduces HP.", hidden: false, behavior: "Uses environment as weapon. Tests intruders before destroying them." },
      { name: "Void Kraken", subtitle: "Space Horror", type: "Solo (Veil-Entity)", hp: 60, maxHp: 60, stress: 0, maxStress: 10, armor: 0, armorMinor: 20, armorSevere: 40, armorSlots: 0, armorMarked: [], evasion: 15, description: "A nightmare of tentacles and eyes swimming through vacuum. Large enough to wrap a frigate.", abilities: [{ name: "Multi-Limb", type: "Action", fearCost: 2, desc: "Make 3 Tentacle attacks (+7, 2d10+6) at different targets." }, { name: "Reality Warping", type: "Passive", fearCost: 0, desc: "Far range is Difficult Terrain. Perception checks have Disadvantage." }, { name: "Gravity Distortion", type: "Action", fearCost: 3, desc: "Separate party. Each character moved to random location." }], keeperNotes: "Weak to drive plumes (fire). Called shot to eyes: high DC but high damage.", hidden: false, behavior: "Separates and isolates prey. Feeds on terror." },
      { name: "War-Titan", subtitle: "Walking Apocalypse", type: "Bruiser (Construct)", hp: 80, maxHp: 80, stress: 0, maxStress: 0, armor: 0, armorMinor: 30, armorSevere: 60, armorSlots: 0, armorMarked: [], evasion: 13, description: "A two-story mech with a corpse-pilot fused to controls. Leaks radiation.", abilities: [{ name: "Salvo", type: "Action", fearCost: 3, desc: "Fire missiles at ALL visible enemies. Agility DC 15 or 4d6 damage." }, { name: "Reactor Leak", type: "Passive", fearCost: 0, desc: "Close range: 1d6 Radiation damage (ignores armor) at end of turn." }, { name: "Vent Heat", type: "Reaction", fearCost: 1, desc: "When Severely damaged, immobile 1 round but creates steam cloud." }], keeperNotes: "Very slow turn speed. Rear heat vents are weak point.", hidden: false, behavior: "Identifies biggest threat, unloads everything. IS cover, doesn't use cover." },
      { name: "The Biomancer", subtitle: "Self-Made Monster", type: "Standard (Mutant)", hp: 45, maxHp: 45, stress: 0, maxStress: 8, armor: 0, armorMinor: 15, armorSevere: 30, armorSlots: 0, armorMarked: [], evasion: 16, description: "A Kryllian scientist with grafted alien limbs. Six arms, shifting skin, evolutionary masterpiece.", abilities: [{ name: "Rapid Adaptation", type: "Reaction", fearCost: 1, desc: "When damaged, gain Resistance to that damage type for encounter." }, { name: "Multi-Limb Assault", type: "Action", fearCost: 1, desc: "3 attacks: Claw (2d8), Needle (1d6+Poison), Shock (1d8+Stun)." }, { name: "Regeneration", type: "Passive", fearCost: 0, desc: "Heal 5 HP at start of turn unless took Fire damage." }], keeperNotes: "Fire stops regeneration. Destroy lab equipment/stims to weaken.", hidden: false, behavior: "Adapts to player tactics each round. Seeks to consume useful traits." }
    ]
  },
  tier5: {
    name: "Tier 5: Mythic",
    description: "Cosmic entities and world-eaters. These are not encounters; they are events requiring fleets and miracles.",
    monsters: [
      { name: "Devourer Phage", subtitle: "Reality Cancer", type: "Mythic Solo", hp: 100, maxHp: 100, stress: 0, maxStress: 0, armor: 0, armorMinor: 25, armorSevere: 50, armorSlots: 0, armorMarked: [], evasion: 16, description: "A writhing mass of Void-corrupted matter. Where it touches, reality unravels.", abilities: [{ name: "Phase State", type: "Passive", fearCost: 0, desc: "Alternates ethereal/solid every 2 rounds. Ethereal = immune to physical." }, { name: "Void Consumption", type: "Action", fearCost: 3, desc: "All in Close range: 3d10 Void damage. Heals HP equal to damage dealt." }, { name: "Reality Tear", type: "Action", fearCost: 4, desc: "Create permanent Void Zone. Entering deals 2d8 damage/round." }, { name: "Hive-Mind Link", type: "Reaction", fearCost: 0, desc: "At 0 HP, broadcasts signal. Other Devourers converge in 2 rounds." }], keeperNotes: "Requires objectives to make vulnerable. Destroying weak points, rituals, etc.", hidden: false, behavior: "Moves toward power sources. Consumes reality itself." },
      { name: "Abyssal Leviathan", subtitle: "Ocean God", type: "Mythic Solo", hp: 150, maxHp: 150, stress: 0, maxStress: 0, armor: 0, armorMinor: 30, armorSevere: 60, armorSlots: 0, armorMarked: [], evasion: 12, description: "A creature the size of a small moon. Its mouth could swallow cities. Its skin bends light.", abilities: [{ name: "Ghost Skin", type: "Passive", fearCost: 0, desc: "Invisible to sensors until it attacks. First attack always surprises." }, { name: "Swallow Whole", type: "Action", fearCost: 5, desc: "Engulf a vehicle. Strength DC 20 to escape or destroyed in 3 rounds." }, { name: "Sonic Roar", type: "Action", fearCost: 3, desc: "All in Far range: 4d10 Sonic damage, deafened." }, { name: "Teeth Harvest", type: "Passive", fearCost: 0, desc: "Teeth can cut through plasteel. Melee ignores all armor." }], keeperNotes: "Blind but has vibration sense. Tech attracts it. Ancient and patient.", hidden: false, behavior: "Drawn to energy signatures. Patient hunter. Unstoppable force." }
    ]
  }
};

// ==================== ENVIRONMENT LIBRARY (FROM CORE RULES) ====================
const MACRO_ENVIRONMENTS = [
  { 
    id: "ecumenopolis", 
    name: "Ecumenopolis (Core World)", 
    type: "Social / Traversal",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Lower Levels", desc: "Slums, forgotten tunnels, recycling plants." },
      { tier: 2, difficulty: 14, name: "Mid-City", desc: "Commercial districts, transit hubs, middle-class hab-blocks." },
      { tier: 3, difficulty: 16, name: "Upper Spires", desc: "Corporate headquarters, noble estates, high security." },
      { tier: 4, difficulty: 18, name: "Imperial District", desc: "The seat of power. Psionic security, absolute surveillance." }
    ],
    description: "A planet wrapped in steel and light. No ground, only layers of city down to magma. The rich touch the sky; the poor live in eternal darkness.",
    features: [
      { name: "Vertical Chase", type: "Passive", desc: "Movement between levels requires Tech or Athletics checks. Falling is lethal without flight." },
      { name: "Surveillance Grid", type: "Passive", desc: "DC 14 Tech to avoid detection. The city sees everything." },
      { name: "Crowd Control", type: "Action", desc: "Spend 1 Fear: Security forces deploy crowd-control measures (gas, barriers, sonic deterrents)." }
    ]
  },
  { 
    id: "death_world", 
    name: "Death World (Toxic/Radioactive)", 
    type: "Survival / Exploration",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Contaminated Zone", desc: "Mild toxins, requires basic filters." },
      { tier: 2, difficulty: 14, name: "Hot Zone", desc: "Aggressive atmosphere, full sealed suits required." },
      { tier: 3, difficulty: 16, name: "Dead Zone", desc: "Instantly lethal without military-grade protection." },
      { tier: 4, difficulty: 18, name: "Bleed Zone", desc: "Veil radiation warps reality. Suits degrade rapidly." }
    ],
    description: "The atmosphere is poison, the rain is acid, the sun emits lethal radiation. Survival is minute-by-minute calculation of oxygen and filter integrity.",
    features: [
      { name: "Hostile Atmosphere", type: "Passive", desc: "1 Stress/minute without sealed suits. Critical Failure on physical checks = Suit Breach (1d6/turn until patched, Tech DC 12)." },
      { name: "Rad Spike", type: "Action", desc: "Intense radiation wave. Find heavy cover or take 2d6 Radiation damage/round. All Tech items suffer 1 Degradation." },
      { name: "Contamination", type: "Reaction", desc: "Trigger: Player takes HP damage. Effect: Environment invades the body. DC 14 or become Infected." }
    ]
  },
  { 
    id: "ice_world", 
    name: "Ice World (Frozen)", 
    type: "Survival / Exploration",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Tundra", desc: "Cold but survivable with standard gear." },
      { tier: 2, difficulty: 14, name: "Glacier Field", desc: "Sub-zero temperatures, crevasses, ice storms." },
      { tier: 3, difficulty: 16, name: "Polar Deep", desc: "Instant frostbite, whiteout conditions permanent." },
      { tier: 4, difficulty: 18, name: "Absolute Zero", desc: "Cryo-volcanic activity, flash-freeze events." }
    ],
    description: "Eternal winter. Temperatures freeze exposed skin in seconds. The wind cuts like knives across endless white plains.",
    features: [
      { name: "Extreme Cold", type: "Passive", desc: "1 Stress/hour without thermal gear. Exposed skin causes 1d4 damage per minute." },
      { name: "Ice Sheet", type: "Passive", desc: "Agility DC 12 or fall Prone. Vehicles have Disadvantage on control checks." },
      { name: "Whiteout", type: "Action", desc: "Blizzard conditions. Visibility reduced to Close range. Disadvantage on all Perception. Navigation DC +4." }
    ]
  },
  { 
    id: "volcanic_world", 
    name: "Volcanic World (Magma/Geothermal)", 
    type: "Hazard / Industrial",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Geothermal Plant", desc: "Steam pipes, hot floors, warning sirens." },
      { tier: 2, difficulty: 14, name: "Active Flow", desc: "Open lava rivers, ash clouds." },
      { tier: 3, difficulty: 16, name: "Caldera", desc: "Inside the volcano. Toxic gas, crumbling platforms." },
      { tier: 4, difficulty: 20, name: "Planetary Core", desc: "Liquid metal ocean. Intense gravity and pressure." }
    ],
    description: "Tectonic instability, magma oceans, ash clouds. Rich in minerals but deadly to habitation. The floor is literally lava.",
    features: [
      { name: "Extreme Heat", type: "Passive", desc: "1 Stress/hour without cooling suits. Heavy Armor causes Fatigue (Disadvantage on Agility)." },
      { name: "Eruption", type: "Action", desc: "Geyser of lava bursts. Dexterity DC 15 or take 3d6 Fire Damage." },
      { name: "Toxic Ash", type: "Reaction", desc: "Trigger: Wind changes. Effect: Area becomes Heavily Obscured and toxic. Breathing masks required." }
    ]
  },
  { 
    id: "dead_world", 
    name: "Dead World (Necropolis)", 
    type: "Exploration / Horror",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Abandoned Colony", desc: "Empty buildings, dust, eerie silence." },
      { tier: 2, difficulty: 14, name: "Ruined City", desc: "Collapsed structures, scavenger activity, traps." },
      { tier: 3, difficulty: 16, name: "Ground Zero", desc: "Whatever killed them is still here. Psychic echoes." },
      { tier: 4, difficulty: 18, name: "The Silence's Touch", desc: "Reality warps. The dead remember." }
    ],
    description: "Civilization existed but was wiped out—by war, disease, or the Silence. A place of ruins, ghosts, and scavengers.",
    features: [
      { name: "Unstable Ruins", type: "Passive", desc: "Structures are rotting. Any explosive or heavy impact causes Collapse (Area Damage, Difficult Terrain)." },
      { name: "Haunted", type: "Passive", desc: "Psychic residue of death is strong. Players cannot clear Stress via resting here." },
      { name: "Scavenger Traps", type: "Reaction", desc: "Trigger: A player searches a room. Effect: Spend 1 Fear. Booby trap triggers (Explosion, Gas, or Alarm)." }
    ]
  },
  { 
    id: "jungle_world", 
    name: "Jungle World (Overgrown)", 
    type: "Survival / Combat",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Forest Edge", desc: "Dense but navigable vegetation." },
      { tier: 2, difficulty: 14, name: "Deep Jungle", desc: "Predators, toxic plants, no visibility." },
      { tier: 3, difficulty: 16, name: "Carnivorous Zone", desc: "The plants hunt. Everything is a trap." },
      { tier: 4, difficulty: 18, name: "Living World", desc: "The jungle is one organism. It thinks." }
    ],
    description: "Aggressive vegetation, predatory fauna, ancient ruins hidden in the canopy. The plants fight back.",
    features: [
      { name: "Dense Canopy", type: "Passive", desc: "Line of sight limited to Medium Range. Long-range weapons have Disadvantage. Flight impossible below canopy." },
      { name: "Animate Flora", type: "Action", desc: "Vines grapple, spore-pods explode. Agility DC 15 or be Restrained or Poisoned (1 Stress/turn)." },
      { name: "The Forest Eyes", type: "Reaction", desc: "Trigger: Stealth check. Effect: Environment betrays them. Stealth DC +2. Failure alerts wildlife." }
    ]
  },
  { 
    id: "deep_space", 
    name: "Deep Space (Void)", 
    type: "Traversal / Combat",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Orbital Station", desc: "Controlled environment, emergency procedures." },
      { tier: 2, difficulty: 14, name: "Asteroid Belt", desc: "Debris, radiation, limited visibility." },
      { tier: 3, difficulty: 16, name: "Deep Void", desc: "No landmarks, extreme distances, isolation." },
      { tier: 4, difficulty: 18, name: "Veil Border", desc: "Reality thins. Strange phenomena." }
    ],
    description: "The emptiness between stars. No gravity, no air, no hope of rescue. Home of miners, scavengers, and exiles.",
    features: [
      { name: "Zero-G", type: "Passive", desc: "Movement requires push-off or thrusters. Kinetic weapon recoil pushes user 5ft. Melee has Disadvantage without anchoring." },
      { name: "Debris Impact", type: "Action", desc: "Rock slams the area. 2d6 Impact damage and knocked spinning (disoriented/stunned)." },
      { name: "Sensor Clutter", type: "Passive", desc: "Metal density is high. Sensors have Disadvantage. Perfect for ambushes." }
    ]
  },
  { 
    id: "veil_pocket", 
    name: "Veil Pocket (Dreamscape)", 
    type: "Surreal / Horror",
    tierScaling: [
      { tier: 1, difficulty: 14, name: "Stable Echo", desc: "A static scene, ghostly but harmless." },
      { tier: 2, difficulty: 16, name: "Lucid Dream", desc: "Environment reacts to thought. Minor hazards." },
      { tier: 3, difficulty: 18, name: "Nightmare", desc: "Hostile entities, active psychological attacks." },
      { tier: 4, difficulty: 22, name: "Deep Veil", desc: "Reality collapse. Thoughts kill." }
    ],
    description: "A bubble of reality inside the Veil. Looks like a memory—twisted. Physics follows emotion, not logic.",
    features: [
      { name: "Dream Logic", type: "Passive", desc: "Physical attacks deal half damage. Social/Mental attacks deal physical damage to enemies." },
      { name: "Nightmare Manifest", type: "Action", desc: "Environment spawns a monster based on a PC's backstory/trauma." },
      { name: "Will to Power", type: "Action", desc: "Spend Hope to alter environment (create bridge, erase wall, summon weapon). No roll required." }
    ]
  },
  { 
    id: "crystalline", 
    name: "Crystalline World (Geode)", 
    type: "Weird / Puzzle",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Crystal Cavern", desc: "Slippery, confusing reflections." },
      { tier: 2, difficulty: 14, name: "Singing Crystals", desc: "Sonic resonance hurts ears. Minor vibration." },
      { tier: 3, difficulty: 16, name: "Psionic Resonance", desc: "Psionic energy amplified. Dangerous feedback." },
      { tier: 4, difficulty: 19, name: "Living Monolith", desc: "The crystals are alive/psionic. They attack." }
    ],
    description: "Silicon-based biology. Trees are crystal spires; water is liquid mercury. Beautiful, sharp, and fragile.",
    features: [
      { name: "Refraction", type: "Passive", desc: "Lasers are unpredictable. Roll d6: 1-3 Reflect (hit ally), 4-6 Amplify (+2 Damage)." },
      { name: "Resonance", type: "Reaction", desc: "Trigger: Loud noise. Effect: Crystals vibrate. 1d8 Sonic damage, Deafened 1 round." },
      { name: "Fragile Floor", type: "Action", desc: "Explosion shatters ground into razor shards. Difficult Terrain, 1d6 damage per 5ft moved." }
    ]
  },
  { 
    id: "megastructure", 
    name: "Artificial World (Megastructure)", 
    type: "Tech / Exploration",
    tierScaling: [
      { tier: 2, difficulty: 14, name: "Outer Shell", desc: "Maintenance corridors, dormant systems." },
      { tier: 3, difficulty: 16, name: "Inner Works", desc: "Active machinery, security protocols awakening." },
      { tier: 4, difficulty: 18, name: "Core Systems", desc: "The machine's brain. Hostile geometry." },
      { tier: 5, difficulty: 20, name: "The Heart", desc: "Precursor AI active. Reality bends to its will." }
    ],
    description: "A machine the size of a planet built by Precursors. The mountains are heat sinks; rivers are coolant lines.",
    features: [
      { name: "Living Geometry", type: "Action", desc: "World reconfigures. Corridors rotate, gravity shifts. Agility Save or be separated/fall." },
      { name: "Repair Drones", type: "Reaction", desc: "Trigger: Players damage structure. Effect: Drone swarm arrives to fix it—and remove the 'infection' (players)." },
      { name: "Power Tap", type: "Passive", desc: "Tech characters can tap walls to recharge batteries or power heavy weapons instantly." }
    ]
  },
  { 
    id: "cyber_city", 
    name: "Cyber-City (Synthetic World)", 
    type: "Tech / Social",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Tourist Zone", desc: "Visitor-friendly, organic accommodations." },
      { tier: 2, difficulty: 14, name: "Residential Grid", desc: "Synthetic citizens, organic second-class." },
      { tier: 3, difficulty: 16, name: "Data Core", desc: "Pure information space. Organics are blind." },
      { tier: 4, difficulty: 18, name: "The Nexus", desc: "AI collective consciousness. Hostile to biologicals." }
    ],
    description: "No organic life. Trees are fiber-optic cables; birds are drones. Paradise of efficiency—cold and alien to biologicals.",
    features: [
      { name: "The Grid", type: "Passive", desc: "Everything connected. Characters with Interface gain Advantage on info gathering. Those without have Disadvantage on Navigation." },
      { name: "System Override", type: "Action", desc: "City attacks. Gravity plates reverse, doors lock, turrets deploy. Tech DC 16 to counter." },
      { name: "Data Stream", type: "Reaction", desc: "Trigger: Tech ability used. Effect: Spend 1 Fear. Signal traced. Location revealed, comms jammed." }
    ]
  },
  { 
    id: "desert_world", 
    name: "Desert World (Barren/Arid)", 
    type: "Survival / Traversal",
    tierScaling: [
      { tier: 1, difficulty: 11, name: "Oasis Region", desc: "Scattered water sources, nomad trails." },
      { tier: 2, difficulty: 13, name: "Dune Sea", desc: "No water, no shade, sandstorms." },
      { tier: 3, difficulty: 15, name: "Glass Wastes", desc: "Glassed by orbital bombardment. Razor terrain." },
      { tier: 4, difficulty: 17, name: "The Furnace", desc: "Temperatures that melt metal. Instant death zone." }
    ],
    description: "Defined by scarcity. Water is more valuable than gold. The sun is a hammer. Nowhere to hide.",
    features: [
      { name: "Scouring Sand", type: "Passive", desc: "Grit ruins technology. Tech items have 1-in-6 chance of Glitch after each scene." },
      { name: "Heat Exhaustion", type: "Passive", desc: "1 Stress per 4 hours without water/shade. Disadvantage on all rolls when dehydrated." },
      { name: "Sandstorm", type: "Action", desc: "Visibility drops to Close. 1d4 damage per round exposed. Movement halved." }
    ]
  }
];

const MICRO_ENVIRONMENTS = [
  { 
    id: "bazaar", 
    name: "Marketplace / Bazaar", 
    type: "Social / Stealth / Trade",
    tierScaling: [
      { tier: 1, difficulty: 11, name: "Street Corner", desc: "Few stalls, basic goods, pickpockets." },
      { tier: 2, difficulty: 13, name: "Trade Hub", desc: "Regulated promenade, House patrols, customs." },
      { tier: 3, difficulty: 15, name: "Black Market", desc: "Hidden sector, illegal tech, assassins." },
      { tier: 4, difficulty: 18, name: "The Auction", desc: "Warlords and nobles. Planets bought and sold." }
    ],
    description: "Sensory assault of noise, color, desperation. Everything is for sale. Stalls piled with scavenged tech and questionable curios.",
    features: [
      { name: "Crowd Cover", type: "Passive", desc: "Hidden beyond Medium Range unless overt action. Moving quickly: Strength/Agility DC (Tier+10) to shove through." },
      { name: "The Pickpocket", type: "Action", desc: "Spend 1 Fear. Thief attempts to lift item. Instinct Reaction Roll or item is gone; chase may ensue." },
      { name: "Hey! That's Mine!", type: "Reaction", desc: "Trigger: Weapon drawn. Effect: Crowd panics. Chaotic (Difficult Terrain). Ranged has Disadvantage. Hitting civilian = Hostile faction." }
    ]
  },
  { 
    id: "noble_estate", 
    name: "Noble Estate / Corporate Penthouse", 
    type: "Social / Infiltration",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Local Governor", desc: "Large house, hired thugs, basic locks." },
      { tier: 2, difficulty: 14, name: "System Lord", desc: "Fortified manor, House Marines, sensors." },
      { tier: 3, difficulty: 16, name: "Great House Noble", desc: "Spire palace, Cyber-Ninjas, DNA scanners." },
      { tier: 4, difficulty: 20, name: "Imperial Court", desc: "Emperor's proximity. Precursor Drones. Psionic security." }
    ],
    description: "A fortress disguised as a palace. Polished marble, real flowers, silent servants—and laser grids, DNA scanners, loyal guards.",
    features: [
      { name: "High Society", type: "Passive", desc: "Presence (Etiquette/Charm) has Advantage. Intimidation/force has Disadvantage and alerts security." },
      { name: "The Panic Room", type: "Action", desc: "Host activates protocols. Blast shutters seal. Floor may drop to cell/beast pit (Agility DC 15). Knockout gas vents." },
      { name: "Silent Alarm", type: "Reaction", desc: "Trigger: Stealth failed or weapon detected. Effect: No sirens. Guards coordinate ambush in next room. Advantage on Initiative." }
    ]
  },
  { 
    id: "cantina", 
    name: "Cantina / Nightclub", 
    type: "Social / Combat / Info",
    tierScaling: [
      { tier: 1, difficulty: 11, name: "The Dive", desc: "Sawdust floors, watered fuel, angry drunks." },
      { tier: 2, difficulty: 13, name: "Spacer Bar", desc: "Neon signs, live music, bounty hunters." },
      { tier: 3, difficulty: 15, name: "VIP Lounge", desc: "Floating booths, House spies, corporate blackmail." },
      { tier: 4, difficulty: 17, name: "Velvet Void", desc: "Zero-G dance floor, psionic vampires, assassinations." }
    ],
    description: "Low ceilings, smoke, bass music. Living room of the working class, office of the underworld. Furniture bolted down for a reason.",
    features: [
      { name: "Improvised Arsenal", type: "Passive", desc: "Finding a weapon succeeds automatically. Bottles/chairs deal 1d6 + Dazed on crit." },
      { name: "Barroom Brawl", type: "Action", desc: "Spend 1 Fear. Fight spreads. Difficult Terrain. 1 Stress if ending turn in open from stray punches/glass." },
      { name: "Loose Lips", type: "Reaction", desc: "Trigger: Buy a round (1 Wealth). Effect: Advantage on next Social/Knowledge check to gather info." }
    ]
  },
  { 
    id: "factory", 
    name: "Factory Floor", 
    type: "Hazard / Combat / Industrial",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Workshop", desc: "Hand tools, minor machinery, oil spills." },
      { tier: 2, difficulty: 14, name: "Assembly Line", desc: "Conveyors, robotic arms, deafening noise." },
      { tier: 3, difficulty: 16, name: "Heavy Industry", desc: "Molten metal, plasma cutters, lethal automation." },
      { tier: 4, difficulty: 18, name: "War Foundry", desc: "Weapons production. Security drones. Explosives everywhere." }
    ],
    description: "Deafening cacophony of pistons, steam, grinding gears. Conveyor belts, robotic arms moving with terrifying speed. Safety is secondary.",
    features: [
      { name: "Industrial Noise", type: "Passive", desc: "Cannot hear beyond Close range. Verbal communication requires shouting (Presence DC 12)." },
      { name: "Conveyor Hazard", type: "Passive", desc: "End turn on belt = moved 20ft toward machinery. Agility DC 13 to jump off safely." },
      { name: "Vent Steam", type: "Reaction", desc: "Trigger: Failure with Fear or explosive used. Effect: Pipe ruptures. 1d6 Fire to Close range. Obscured 1d4 rounds." }
    ]
  },
  { 
    id: "derelict", 
    name: "Derelict Ship", 
    type: "Exploration / Horror",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Abandoned Freighter", desc: "Empty, dusty, minor hazards." },
      { tier: 2, difficulty: 14, name: "Ghost Ship", desc: "Something killed the crew. Evidence remains." },
      { tier: 3, difficulty: 16, name: "Plague Vessel", desc: "Contamination active. Quarantine protocols." },
      { tier: 4, difficulty: 18, name: "Void-Touched", desc: "The Veil has claimed it. Reality unstable." }
    ],
    description: "A ghost ship drifting in the void. What killed the crew? Emergency lighting flickers. Some sections have no air.",
    features: [
      { name: "Zero-G Pockets", type: "Passive", desc: "Gravity fails unpredictably. Check each room: 1-2 on d6 = Zero-G conditions." },
      { name: "Life Support Failure", type: "Passive", desc: "Some areas have no air. 1 Stress per round without suits. Must find or restore power." },
      { name: "Emergency Lighting", type: "Passive", desc: "Disadvantage on Perception. Light sources attract... whatever is still aboard." }
    ]
  },
  { 
    id: "prison", 
    name: "Prison Complex", 
    type: "Infiltration / Combat",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Local Lockup", desc: "Drunk tank, petty criminals, bribable guards." },
      { tier: 2, difficulty: 14, name: "Penal Colony", desc: "Hard labor, gang politics, minimal security." },
      { tier: 3, difficulty: 16, name: "Maximum Security", desc: "Suppression fields, elite guards, isolation." },
      { tier: 4, difficulty: 19, name: "The Deep Freeze", desc: "Cryo-stasis, mind-wiping tech, no escape." }
    ],
    description: "Maximum security. Suppression fields, guards, desperate inmates. Getting in is hard; getting out is harder.",
    features: [
      { name: "Suppression Field", type: "Passive", desc: "Tech and Magic users have Disadvantage on all rolls. Psionic powers cost double Stress." },
      { name: "Prison Riot", type: "Action", desc: "Incite chaos. Difficult Terrain. Guards distracted. Advantage on Stealth but 1d6 damage if ending turn in open." },
      { name: "Lockdown", type: "Reaction", desc: "Trigger: Alarm. Effect: Blast doors seal every 10ft. Requires hacking (Tech) or explosives. Movement DC +2." }
    ]
  },
  { 
    id: "bunker", 
    name: "Military Bunker", 
    type: "Combat / Tactical",
    tierScaling: [
      { tier: 2, difficulty: 14, name: "Militia Post", desc: "Sandbags, basic weapons, volunteer guards." },
      { tier: 3, difficulty: 16, name: "Forward Base", desc: "Professional soldiers, overlapping fire lanes." },
      { tier: 4, difficulty: 18, name: "Fortress", desc: "Hardened bunker, heavy weapons, blast doors." },
      { tier: 5, difficulty: 20, name: "Command Center", desc: "Strategic HQ. Elite troops. Orbital defense link." }
    ],
    description: "Fortified position with overlapping fields of fire. Kill zones, automated turrets, blast doors. Built to withstand sieges.",
    features: [
      { name: "Kill Zones", type: "Passive", desc: "Specific corridors have no cover. Crossing requires Sprint action or taking Opportunity Attacks." },
      { name: "Automated Turrets", type: "Passive", desc: "Attack anyone without IFF tags. +4, 2d6 damage. Can be hacked (Tech DC 16) or destroyed (15 HP)." },
      { name: "Blast Doors", type: "Action", desc: "Seal or unseal sections. Can trap enemies or protect allies. Override: Tech DC 15 or explosives." }
    ]
  },
  { 
    id: "medical_bay", 
    name: "Medical Bay / Hospital", 
    type: "Support / Social",
    tierScaling: [
      { tier: 1, difficulty: 10, name: "Field Clinic", desc: "Basic supplies, overwhelmed staff." },
      { tier: 2, difficulty: 12, name: "Station Med-Bay", desc: "Proper equipment, trained doctors." },
      { tier: 3, difficulty: 15, name: "Trauma Center", desc: "Advanced tech, experimental treatments." },
      { tier: 4, difficulty: 18, name: "Quarantine Zone", desc: "Bio-hazard Level 4. Deadly plagues. Burn protocols." }
    ],
    description: "Clean, sterile, full of useful supplies. The smell of antiseptic. Patients in beds. Non-combatants everywhere.",
    features: [
      { name: "Sterile Field", type: "Passive", desc: "All Medicine checks have Advantage. Resting here recovers 1 additional HP." },
      { name: "Bio-Hazard", type: "Action", desc: "Containment breaks. Virus/gas/nanites flood room. Body DC 14 or Infected (1 Stress/turn or debuff)." },
      { name: "Collateral Risk", type: "Passive", desc: "Non-combatants everywhere. Blast/AoE weapons hit civilians = Stress (Guilt) + Reputation loss." }
    ]
  },
  { 
    id: "gambling_den", 
    name: "Gambling Den / Casino", 
    type: "Social / Minigame / Risk",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Back Alley Dice", desc: "Credits and scrap on crates." },
      { tier: 2, difficulty: 14, name: "Casino Floor", desc: "Regulated games, security bouncers." },
      { tier: 3, difficulty: 16, name: "High Roller Suite", desc: "Fortunes won and lost. Nobles and Crime Lords." },
      { tier: 4, difficulty: 19, name: "Void-Wheel", desc: "Betting souls, ships, memories. The House always wins." }
    ],
    description: "Darker and richer than a cantina. Velvet tables, chip clatter, spinning holographic wheels. Fortunes change in seconds.",
    features: [
      { name: "High Stakes", type: "Action", desc: "Join a game. Wager Wealth (1-3). Roll Instinct + Presence. Success: Double wager. Failure: Lose it." },
      { name: "The House Always Wins", type: "Passive", desc: "Security is subtle but absolute. Cheating detected = private room 'conversation' with enforcers." },
      { name: "Debt Collector", type: "Reaction", desc: "Trigger: Player loses big. Effect: Loan shark offers credit. Refusing = Disadvantage on all Social rolls here." }
    ]
  },
  { 
    id: "cargo_hold", 
    name: "Cargo Hold / Warehouse", 
    type: "Combat / Exploration",
    tierScaling: [
      { tier: 1, difficulty: 11, name: "Storage Unit", desc: "Small containers, single entrance." },
      { tier: 2, difficulty: 13, name: "Ship's Hold", desc: "Stacked crates, mag-lifts, dim lighting." },
      { tier: 3, difficulty: 15, name: "Distribution Center", desc: "Massive facility, automated systems, security." },
      { tier: 4, difficulty: 17, name: "Black Site Vault", desc: "Hidden contraband. Lethal defenses. No witnesses." }
    ],
    description: "Towering stacks of containers, narrow aisles, industrial loading equipment. Perfect for ambushes and hide-and-seek.",
    features: [
      { name: "Shifting Cover", type: "Passive", desc: "Cover is abundant but unstable. Critical Failure = cover collapses, revealing position." },
      { name: "Industrial Equipment", type: "Action", desc: "Forklifts, cranes, mag-loaders. Can be weaponized: 2d8 damage, Strength DC 14 to control." },
      { name: "Container Collapse", type: "Reaction", desc: "Trigger: Explosion or heavy impact. Effect: Stack falls. Agility DC 13 or 2d6 damage and Restrained." }
    ]
  },
  { 
    id: "engine_room", 
    name: "Engine Room / Reactor Core", 
    type: "Hazard / Tech",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Auxiliary Systems", desc: "Secondary generators, maintenance access." },
      { tier: 2, difficulty: 14, name: "Main Engineering", desc: "Primary reactor, plasma conduits." },
      { tier: 3, difficulty: 16, name: "Core Chamber", desc: "Direct reactor access. Lethal radiation." },
      { tier: 4, difficulty: 18, name: "Overload State", desc: "Meltdown imminent. Everything is lethal." }
    ],
    description: "The heart of the ship. Plasma conduits, spinning turbines, the thrum of raw power. One wrong move and everyone dies.",
    features: [
      { name: "Radiation Exposure", type: "Passive", desc: "1 Stress per 10 minutes without protection. Near core: 1 Stress per round." },
      { name: "Plasma Leak", type: "Action", desc: "Rupture a conduit. 3d6 Fire damage in line. Can be directed at enemies (Tech DC 14)." },
      { name: "Emergency Shutdown", type: "Reaction", desc: "Trigger: Critical damage to systems. Effect: Ship loses power. Emergency lighting. Life support has 1 hour of backup." }
    ]
  },
  { 
    id: "hangar_bay", 
    name: "Hangar Bay / Docking Area", 
    type: "Combat / Traversal",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Private Berth", desc: "Single ship, basic equipment." },
      { tier: 2, difficulty: 14, name: "Commercial Dock", desc: "Multiple ships, fuel lines, workers." },
      { tier: 3, difficulty: 16, name: "Military Hangar", desc: "Fighter wings, armed personnel, security." },
      { tier: 4, difficulty: 18, name: "Carrier Bay", desc: "Capital ship operations. Constant activity. Lethal." }
    ],
    description: "Cavernous space filled with ships, fuel lines, loading equipment. The roar of engines, the hiss of airlocks.",
    features: [
      { name: "Vehicle Cover", type: "Passive", desc: "Ships provide excellent cover. But fuel lines nearby mean fire = explosion (3d6 in Close range)." },
      { name: "Airlock Override", type: "Action", desc: "Vent atmosphere. Everyone not anchored: Strength DC 15 or sucked toward void. 1d6 damage from debris." },
      { name: "Engine Wash", type: "Reaction", desc: "Trigger: Ship powers up. Effect: 2d8 Fire damage in cone behind thrusters. Ignites fuel spills." }
    ]
  },
  { 
    id: "bridge", 
    name: "Bridge / Command Center", 
    type: "Tactical / Social / Boss Arena",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Freighter Bridge", desc: "Cramped, functional, minimal crew." },
      { tier: 2, difficulty: 14, name: "Corvette Bridge", desc: "Security station, comms officer." },
      { tier: 3, difficulty: 16, name: "Cruiser Bridge", desc: "Tiered stations, marine guards." },
      { tier: 4, difficulty: 19, name: "Dreadnought CIC", desc: "Massive amphitheater of war." }
    ],
    description: "The brain of the beast. Screens showing battle outside. Captain's chair on a dais. Decisions made here kill thousands.",
    features: [
      { name: "Tactical View", type: "Passive", desc: "Characters on Bridge can issue commands to allies elsewhere (granting Advantage). They know enemy positions." },
      { name: "Internal Defense", type: "Action", desc: "Captain activates countermeasures. Turrets drop from ceiling. Gravity plates pin intruders (Strength DC 14)." },
      { name: "Self-Destruct", type: "Reaction", desc: "Trigger: Captain dies/surrenders. Effect: Ship begins to die. Countdown starts (usually 10 rounds)." }
    ]
  },
  { 
    id: "transit_hub", 
    name: "Transit Hub / Spaceport", 
    type: "Chase / Traversal / Surveillance",
    tierScaling: [
      { tier: 1, difficulty: 12, name: "Local Station", desc: "Small terminal, few guards." },
      { tier: 2, difficulty: 14, name: "Regional Hub", desc: "Multiple gates, customs, crowds." },
      { tier: 3, difficulty: 16, name: "Starport", desc: "Interstellar traffic, heavy security, factions." },
      { tier: 4, difficulty: 18, name: "Nexus Prime", desc: "Galactic crossroads. Every faction. Maximum surveillance." }
    ],
    description: "Vast and echoing. Endless announcements, high ceilings, massive departure boards. A choke point for anyone leaving or entering.",
    features: [
      { name: "Checkpoint", type: "Passive", desc: "Security scans at every gate. Smuggling requires Finesse DC 14 or items confiscated, identity flagged." },
      { name: "The Crowd Surge", type: "Action", desc: "Trigger panic or delay. Difficult Terrain. Pursuit checks have Disadvantage." },
      { name: "Final Boarding", type: "Reaction", desc: "Trigger: Chase scene. Effect: Target's transport begins departure. 3 rounds to board or they escape." }
    ]
  }
];

// ==================== SCENE MANAGEMENT ====================
function showAddSceneModal() {
  $('#sceneModal').classList.remove('hidden');
  $('#sceneModalTitle').textContent = 'Add New Scene';
  $('#sceneModalMode').value = 'add';
  clearSceneForm();
}

function showEditSceneModal(sceneId) {
  const scene = state.scenes.find(s => s.id === sceneId);
  if (!scene) return;
  
  $('#sceneModal').classList.remove('hidden');
  $('#sceneModalTitle').textContent = 'Edit Scene';
  $('#sceneModalMode').value = 'edit';
  $('#sceneEditId').value = sceneId;
  
  // Fill form with scene data
  $('#sceneNameInput').value = scene.name || '';
  $('#sceneLocationInput').value = scene.location || '';
  $('#sceneNotesInput').value = scene.notes || '';
  $('#sceneAtmosphereInput').value = scene.details?.atmosphere || '';
  $('#sceneObjectivesInput').value = (scene.details?.objectives || []).join('\n');
  $('#sceneKeyRollsInput').value = (scene.details?.keyRolls || []).join('\n');
  $('#sceneNpcsPresentInput').value = (scene.details?.npcsPresent || []).join('\n');
  $('#sceneOutcomesInput').value = (scene.details?.possibleOutcomes || []).join('\n');
  $('#sceneTipsInput').value = scene.details?.tips || '';
  
  // Set environment values and trigger tier updates
  $('#sceneMacroEnv').value = scene.environment?.macro || '';
  updateMacroTierOptions();
  if (scene.environment?.macroTier) {
    $('#sceneMacroTier').value = scene.environment.macroTier;
    updateMacroDifficulty();
  }
  
  $('#sceneMicroEnv').value = scene.environment?.micro || '';
  updateMicroTierOptions();
  if (scene.environment?.microTier) {
    $('#sceneMicroTier').value = scene.environment.microTier;
    updateMicroDifficulty();
  }
  
  $('#sceneEnvModifier').value = scene.environment?.modifier || '';
}

function clearSceneForm() {
  $('#sceneEditId').value = '';
  $('#sceneNameInput').value = '';
  $('#sceneLocationInput').value = '';
  $('#sceneNotesInput').value = '';
  $('#sceneAtmosphereInput').value = '';
  $('#sceneObjectivesInput').value = '';
  $('#sceneKeyRollsInput').value = '';
  $('#sceneNpcsPresentInput').value = '';
  $('#sceneOutcomesInput').value = '';
  $('#sceneTipsInput').value = '';
  $('#sceneMacroEnv').value = '';
  $('#sceneMicroEnv').value = '';
  $('#sceneEnvModifier').value = '';
  $('#sceneMacroTier').innerHTML = '<option value="">--</option>';
  $('#sceneMicroTier').innerHTML = '<option value="">--</option>';
  $('#sceneMacroDC').value = '--';
  $('#sceneMicroDC').value = '--';
  $('#sceneMacroTierDesc').classList.add('hidden');
  $('#sceneMicroTierDesc').classList.add('hidden');
}

function hideSceneModal() {
  $('#sceneModal').classList.add('hidden');
}

function saveScene() {
  const mode = $('#sceneModalMode').value;
  const name = $('#sceneNameInput').value.trim();
  if (!name) { alert('Please enter a scene name'); return; }
  
  const sceneData = {
    name: name,
    location: $('#sceneLocationInput').value.trim() || 'Unknown',
    notes: $('#sceneNotesInput').value.trim(),
    details: {
      atmosphere: $('#sceneAtmosphereInput').value.trim(),
      objectives: $('#sceneObjectivesInput').value.split('\n').filter(s => s.trim()),
      keyRolls: $('#sceneKeyRollsInput').value.split('\n').filter(s => s.trim()),
      npcsPresent: $('#sceneNpcsPresentInput').value.split('\n').filter(s => s.trim()),
      possibleOutcomes: $('#sceneOutcomesInput').value.split('\n').filter(s => s.trim()),
      tips: $('#sceneTipsInput').value.trim()
    },
    environment: {
      macro: $('#sceneMacroEnv').value,
      macroTier: parseInt($('#sceneMacroTier').value) || null,
      macroDC: parseInt($('#sceneMacroDC').value) || null,
      micro: $('#sceneMicroEnv').value,
      microTier: parseInt($('#sceneMicroTier').value) || null,
      microDC: parseInt($('#sceneMicroDC').value) || null,
      modifier: $('#sceneEnvModifier').value.trim()
    }
  };
  
  if (mode === 'add') {
    sceneData.id = Date.now();
    state.scenes.push(sceneData);
  } else {
    const sceneId = parseInt($('#sceneEditId').value);
    const index = state.scenes.findIndex(s => s.id === sceneId);
    if (index !== -1) {
      sceneData.id = sceneId;
      state.scenes[index] = sceneData;
    }
  }
  
  hideSceneModal();
  renderAll();
}

// ==================== ENVIRONMENT TIER SELECTION ====================
function updateMacroTierOptions() {
  const envId = $('#sceneMacroEnv').value;
  const tierSelect = $('#sceneMacroTier');
  const dcInput = $('#sceneMacroDC');
  const descDiv = $('#sceneMacroTierDesc');
  
  tierSelect.innerHTML = '<option value="">--</option>';
  dcInput.value = '--';
  descDiv.classList.add('hidden');
  
  if (!envId) return;
  
  const env = MACRO_ENVIRONMENTS.find(e => e.id === envId);
  if (!env || !env.tierScaling) return;
  
  env.tierScaling.forEach(tier => {
    const opt = document.createElement('option');
    opt.value = tier.tier;
    opt.textContent = `Tier ${tier.tier}: ${tier.name}`;
    tierSelect.appendChild(opt);
  });
}

function updateMacroDifficulty() {
  const envId = $('#sceneMacroEnv').value;
  const tierValue = parseInt($('#sceneMacroTier').value);
  const dcInput = $('#sceneMacroDC');
  const descDiv = $('#sceneMacroTierDesc');
  
  if (!envId || !tierValue) {
    dcInput.value = '--';
    descDiv.classList.add('hidden');
    return;
  }
  
  const env = MACRO_ENVIRONMENTS.find(e => e.id === envId);
  if (!env || !env.tierScaling) return;
  
  const tier = env.tierScaling.find(t => t.tier === tierValue);
  if (tier) {
    dcInput.value = tier.difficulty;
    descDiv.innerHTML = `<strong>${tier.name}:</strong> ${tier.desc}`;
    descDiv.classList.remove('hidden');
  }
}

function updateMicroTierOptions() {
  const envId = $('#sceneMicroEnv').value;
  const tierSelect = $('#sceneMicroTier');
  const dcInput = $('#sceneMicroDC');
  const descDiv = $('#sceneMicroTierDesc');
  
  tierSelect.innerHTML = '<option value="">--</option>';
  dcInput.value = '--';
  descDiv.classList.add('hidden');
  
  if (!envId) return;
  
  const env = MICRO_ENVIRONMENTS.find(e => e.id === envId);
  if (!env || !env.tierScaling) return;
  
  env.tierScaling.forEach(tier => {
    const opt = document.createElement('option');
    opt.value = tier.tier;
    opt.textContent = `Tier ${tier.tier}: ${tier.name}`;
    tierSelect.appendChild(opt);
  });
}

function updateMicroDifficulty() {
  const envId = $('#sceneMicroEnv').value;
  const tierValue = parseInt($('#sceneMicroTier').value);
  const dcInput = $('#sceneMicroDC');
  const descDiv = $('#sceneMicroTierDesc');
  
  if (!envId || !tierValue) {
    dcInput.value = '--';
    descDiv.classList.add('hidden');
    return;
  }
  
  const env = MICRO_ENVIRONMENTS.find(e => e.id === envId);
  if (!env || !env.tierScaling) return;
  
  const tier = env.tierScaling.find(t => t.tier === tierValue);
  if (tier) {
    dcInput.value = tier.difficulty;
    descDiv.innerHTML = `<strong>${tier.name}:</strong> ${tier.desc}`;
    descDiv.classList.remove('hidden');
  }
}

function deleteScene(sceneId) {
  if (confirm('Delete this scene?')) {
    state.scenes = state.scenes.filter(s => s.id !== sceneId);
    if (state.currentScene === sceneId && state.scenes.length > 0) {
      state.currentScene = state.scenes[0].id;
    }
    renderAll();
  }
}

function setCurrentScene(sceneId) {
  state.currentScene = sceneId;
  renderAll();
}

function getEnvironmentDisplay(scene) {
  if (!scene.environment || (!scene.environment.macro && !scene.environment.micro)) return '';
  
  let html = '<div class="scene-environment">';
  html += '<h5>🌍 Environment</h5>';
  
  if (scene.environment.macro) {
    const macro = MACRO_ENVIRONMENTS.find(e => e.id === scene.environment.macro);
    if (macro) {
      html += `<div class="env-layer macro">
        <span class="env-label">Macro:</span> <strong>${escapeHtml(macro.name)}</strong> (DC ${macro.difficulty})
        <p class="env-desc">${escapeHtml(macro.description)}</p>
        <ul class="env-features">${macro.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
      </div>`;
    }
  }
  
  if (scene.environment.micro) {
    const micro = MICRO_ENVIRONMENTS.find(e => e.id === scene.environment.micro);
    if (micro) {
      html += `<div class="env-layer micro">
        <span class="env-label">Micro:</span> <strong>${escapeHtml(micro.name)}</strong> (DC ${micro.difficulty})
        <p class="env-desc">${escapeHtml(micro.description)}</p>
        <ul class="env-features">${micro.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
      </div>`;
    }
  }
  
  if (scene.environment.modifier) {
    html += `<div class="env-modifier"><span class="env-label">Active Modifier:</span> ${escapeHtml(scene.environment.modifier)}</div>`;
  }
  
  html += '</div>';
  return html;
}

// ==================== CHARACTER EDITING ====================
function showEditCharacterModal(type, id) {
  let char;
  if (type === 'player') char = state.players.find(p => p.id === id);
  else if (type === 'npc') char = state.npcs.find(n => n.id === id);
  else if (type === 'monster') char = state.monsters.find(m => m.id === id);
  if (!char) return;
  
  $('#addCharModal').classList.remove('hidden');
  $('#addCharModalTitle').textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  $('#addCharType').value = type;
  $('#addCharEditId').value = id;
  
  // Show/hide ally checkbox (only for NPCs)
  $('#allyCheckboxContainer').classList.toggle('hidden', type !== 'npc');
  
  // Show abilities editor for NPCs and monsters
  const showAbilities = type === 'npc' || type === 'monster';
  const abilitiesEditor = $('#abilitiesEditorContainer');
  if (abilitiesEditor) abilitiesEditor.classList.toggle('hidden', !showAbilities);
  
  // Fill form with character data
  $('#addCharName').value = char.name || '';
  $('#addCharSubtitle').value = char.subtitle || '';
  $('#addCharHp').value = char.maxHp || 7;
  $('#addCharMaxStress').value = char.maxStress || 6;
  $('#addCharArmor').value = char.armor || 3;
  $('#addCharMinor').value = char.armorMinor || 5;
  $('#addCharSevere').value = char.armorSevere || 10;
  $('#addCharArmorSlots').value = char.armorSlots || 3;
  $('#addCharEvasion').value = char.evasion || 10;
  $('#addCharDescription').value = char.description || '';
  $('#addCharKeeperNotes').value = char.keeperNotes || '';
  $('#addCharHidden').checked = char.hidden || false;
  $('#addCharIsAlly').checked = char.isAlly || false;
  
  // Load abilities for NPCs/monsters (convert fearCost to cost for modal)
  if (type !== 'player') {
    state.modalAbilities = (char.abilities || []).map(a => ({
      name: a.name,
      type: a.type,
      cost: a.cost || a.fearCost || 0,
      desc: a.desc
    }));
    state.editingAbilityIndex = null;
    renderModalAbilities();
  }
  
  updateCostTypeLabel();
}

// ==================== SECTION EXPORT/IMPORT ====================
function showExportModal() {
  $('#exportModal').classList.remove('hidden');
}

function hideExportModal() {
  $('#exportModal').classList.add('hidden');
}

function exportSection(section) {
  let data, filename;
  
  switch(section) {
    case 'players':
      data = { type: 'voidlight_players', version: '1.0', players: state.players };
      filename = 'voidlight_players.json';
      break;
    case 'npcs':
      data = { type: 'voidlight_npcs', version: '1.0', npcs: state.npcs };
      filename = 'voidlight_npcs.json';
      break;
    case 'monsters':
      data = { type: 'voidlight_monsters', version: '1.0', monsters: state.monsters };
      filename = 'voidlight_monsters.json';
      break;
    case 'scenes':
      data = { type: 'voidlight_scenes', version: '1.0', scenes: state.scenes };
      filename = 'voidlight_scenes.json';
      break;
    case 'clocks':
      data = { type: 'voidlight_clocks', version: '1.0', clocks: state.clocks };
      filename = 'voidlight_clocks.json';
      break;
    case 'all':
      saveCampaign();
      return;
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importSection(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Determine what type of data this is
      if (data.type === 'voidlight_players' && data.players) {
        if (confirm(`Import ${data.players.length} players? This will add to existing players.`)) {
          data.players.forEach(p => { p.id = Date.now() + Math.random(); state.players.push(p); });
        }
      } else if (data.type === 'voidlight_npcs' && data.npcs) {
        if (confirm(`Import ${data.npcs.length} NPCs? This will add to existing NPCs.`)) {
          data.npcs.forEach(n => { n.id = Date.now() + Math.random(); state.npcs.push(n); });
        }
      } else if (data.type === 'voidlight_monsters' && data.monsters) {
        if (confirm(`Import ${data.monsters.length} monsters? This will add to existing monsters.`)) {
          data.monsters.forEach(m => { m.id = Date.now() + Math.random(); state.monsters.push(m); });
        }
      } else if (data.type === 'voidlight_scenes' && data.scenes) {
        if (confirm(`Import ${data.scenes.length} scenes? This will add to existing scenes.`)) {
          data.scenes.forEach(s => { s.id = Date.now() + Math.random(); state.scenes.push(s); });
        }
      } else if (data.type === 'voidlight_clocks' && data.clocks) {
        if (confirm(`Import ${data.clocks.length} clocks? This will add to existing clocks.`)) {
          data.clocks.forEach(c => { c.id = Date.now() + Math.random(); state.clocks.push(c); });
        }
      } else if (data.sessionName || data.players) {
        // Full campaign file
        if (confirm('This looks like a full campaign file. Load it as a new campaign?')) {
          loadCampaignData(data);
          originalTemplate = JSON.parse(JSON.stringify(data));
        }
      } else {
        alert('Unknown file format');
        return;
      }
      
      renderAll();
      alert('Import successful!');
    } catch (err) {
      alert('Error importing file: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ==================== MONSTER BESTIARY UI ====================
function showBestiaryModal() {
  $('#bestiaryModal').classList.remove('hidden');
  renderBestiary();
}

function hideBestiaryModal() {
  $('#bestiaryModal').classList.add('hidden');
}

function renderBestiary() {
  const container = $('#bestiaryContent');
  if (!container) return;
  
  let html = '';
  
  for (const [tierKey, tier] of Object.entries(MONSTER_BESTIARY)) {
    html += `
      <div class="bestiary-tier">
        <h3 class="bestiary-tier-title">${escapeHtml(tier.name)}</h3>
        <p class="bestiary-tier-desc">${escapeHtml(tier.description)}</p>
        <div class="bestiary-monsters">
          ${tier.monsters.map(monster => `
            <div class="bestiary-monster-card">
              <div class="bestiary-monster-header">
                <div>
                  <strong>${escapeHtml(monster.name)}</strong>
                  <span class="bestiary-subtitle">${escapeHtml(monster.subtitle)}</span>
                </div>
                <button class="btn btn-small btn-purple" onclick="addMonsterFromBestiary('${tierKey}', '${monster.name}')">+ Add</button>
              </div>
              <div class="bestiary-monster-stats">
                <span>HP: ${monster.hp}</span>
                <span>Evasion: ${monster.evasion}</span>
                <span>Minor: ${monster.armorMinor}</span>
                <span>Severe: ${monster.armorSevere}</span>
              </div>
              <p class="bestiary-monster-desc">${escapeHtml(monster.description)}</p>
              <div class="bestiary-monster-behavior"><strong>Behavior:</strong> ${escapeHtml(monster.behavior)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function addMonsterFromBestiary(tierKey, monsterName) {
  const tier = MONSTER_BESTIARY[tierKey];
  if (!tier) return;
  
  const template = tier.monsters.find(m => m.name === monsterName);
  if (!template) return;
  
  const newMonster = JSON.parse(JSON.stringify(template));
  newMonster.id = Date.now();
  newMonster.hp = newMonster.maxHp;
  newMonster.stress = 0;
  newMonster.armorMarked = [];
  
  state.monsters.push(newMonster);
  state.dashboardPins.monsters.push(newMonster.id);
  
  hideBestiaryModal();
  renderAll();
  alert(`${monsterName} added to monsters!`);
}

function loadAllBestiaryMonsters() {
  if (!confirm('This will add ALL monsters from the bestiary to your campaign. Continue?')) return;
  
  let count = 0;
  for (const tier of Object.values(MONSTER_BESTIARY)) {
    for (const template of tier.monsters) {
      const newMonster = JSON.parse(JSON.stringify(template));
      newMonster.id = Date.now() + Math.random();
      newMonster.hp = newMonster.maxHp;
      newMonster.stress = 0;
      newMonster.armorMarked = [];
      newMonster.hidden = true; // Hide by default
      state.monsters.push(newMonster);
      count++;
    }
  }
  
  hideBestiaryModal();
  renderAll();
  alert(`${count} monsters added (hidden by default). Reveal them as needed.`);
}
