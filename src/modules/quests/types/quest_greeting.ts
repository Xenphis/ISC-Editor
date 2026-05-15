// Structure de données pour quest_greeting (TrinityCore 3.3.5)
// Types adaptés pour TypeScript

export interface QuestGreeting {
  ID: number;
  Type: number;
  GreetEmoteType: number;
  GreetEmoteDelay: number;
  Greeting?: string;
  VerifiedBuild?: number;
}
