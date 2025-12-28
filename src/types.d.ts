export type Point = {
  x: number;
  y: number;
};

export type GUIElement = {
  type: string | undefined;
  id: string | undefined;
};

export enum NodeType {
  Generate,
  Input,
  Output,
}

export type OAIAPI = {
  choices: OAIResponse[];
};

export type OAIResponse = {
  index: number;
  text: string;
  message: { content: string };
  logprobs: string;
  finish_reason: string;
};
