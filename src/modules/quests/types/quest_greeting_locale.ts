// Structure de données pour quest_greeting_locale (TrinityCore 3.3.5)
// Types adaptés pour TypeScript

export interface QuestGreetingLocale {
  ID: number;
  Type: number;
  locale: string;
  Greeting?: string;
  VerifiedBuild?: number;
}
