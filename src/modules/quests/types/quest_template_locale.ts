// Structure de données pour quest_template_locale (TrinityCore 3.3.5)
// Types adaptés pour TypeScript

export interface QuestTemplateLocale {
  ID: number;
  locale: string;
  Title?: string;
  Details?: string;
  Objectives?: string;
  EndText?: string;
  CompletedText?: string;
  ObjectiveText1?: string;
  ObjectiveText2?: string;
  ObjectiveText3?: string;
  ObjectiveText4?: string;
  VerifiedBuild?: number;
}
