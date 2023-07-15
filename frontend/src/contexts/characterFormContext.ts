import { createFormContext } from "@mantine/form";
import { CharacterFormType } from "../common/types";

export const [CharacterFormProvider, useCharacterFormContext, useCharacterForm] =
  createFormContext<CharacterFormType>();
