/* eslint-disable react-hooks/exhaustive-deps */
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  FileButton,
  Group,
  MediaQuery,
  MultiSelect,
  Space,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { FC, useEffect, useRef, useState } from "react";
import { AiFillDelete, AiFillFileImage } from "react-icons/ai";
import { useUploadAvatar } from "../../common/utils";
import { useCharacterFormContext } from "../../contexts/characterFormContext";

const BasicTab: FC = () => {
  const form = useCharacterFormContext();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarId, avatarUploading] = useUploadAvatar(avatarFile, form.values.avatar_id);

  const resetRef = useRef<() => void>(null);

  // Advanced Options
  const [personalitiesData, setPersonalitiesData] = useState<{ value: string; label: string }[]>([]);
  const [responseStylesData, setResponseStylesData] = useState<{ value: string; label: string }[]>([]);
  const [favoriteWordsData, setFavoriteWordsData] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    // Set form's avatar URL here
    form.setFieldValue("avatar_id", avatarId);
  }, [avatarId]);

  useEffect(() => {
    form.values.personalities.forEach((item) => {
      setPersonalitiesData((previous) => [...previous, { label: item, value: item }]);
    });
    form.values.response_styles.forEach((item) => {
      setResponseStylesData((previous) => [...previous, { label: item, value: item }]);
    });
    form.values.favorite_words.forEach((item) => {
      setFavoriteWordsData((previous) => [...previous, { label: item, value: item }]);
    });
  }, []);

  return (
    <Box>
      <Stack>
        <MediaQuery
          smallerThan="xs"
          styles={{
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Group align="flex-end">
            <TextInput
              withAsterisk
              label="Name"
              placeholder="Character Name"
              sx={{ flex: 1 }}
              disabled={form.values.previewOnly}
              defaultValue={form.values.name}
              onBlur={(e) => {
                form.setFieldValue("name", e.currentTarget.value);
              }}
              error={form.errors.name}
            />
            <Group spacing="xs">
              <Avatar src={`/api/files/render-avatar?id=${form.values.avatar_id}`} alt="Character Avatar" />
              {!form.values.previewOnly && (
                <>
                  <FileButton resetRef={resetRef} onChange={setAvatarFile} accept="image/png,image/jpeg,image/gif">
                    {(props) => (
                      <Button {...props} leftIcon={<AiFillFileImage />} loading={avatarUploading}>
                        Upload Avatar
                      </Button>
                    )}
                  </FileButton>
                  <ActionIcon
                    disabled={!form.values.avatar_id}
                    color="red"
                    onClick={() => {
                      setAvatarFile(null);
                      form.setFieldValue("avatar_id", null);
                      resetRef.current?.();
                    }}
                    size="lg"
                    variant="filled"
                  >
                    <AiFillDelete />
                  </ActionIcon>
                </>
              )}
            </Group>
          </Group>
        </MediaQuery>
        <MediaQuery
          smallerThan="md"
          styles={{
            flexDirection: "column",
            alignItems: "unset",
            ".mantine-Textarea-root": {
              maxWidth: "unset",
            },
          }}
        >
          <Group grow align="flex-start">
            <Textarea
              withAsterisk
              label="Public Description"
              placeholder="Ex: Deadpool is a character from..."
              disabled={form.values.previewOnly}
              minRows={20}
              description="The description that is shown in the characters page."
              defaultValue={form.values.public_description || ""}
              onBlur={(e) => {
                form.setFieldValue("public_description", e.currentTarget.value);
              }}
              error={form.errors.public_description}
            />
            <Textarea
              withAsterisk
              label="Model Description"
              placeholder="Ex: You are deadpool, a character from..."
              disabled={form.values.previewOnly}
              minRows={20}
              description="The description that is fed to the AI. This is what the AI listens to. It is recommended that you use the word 'You' to describe the character."
              defaultValue={form.values.description || ""}
              onBlur={(e) => {
                form.setFieldValue("description", e.currentTarget.value);
              }}
              error={form.errors.description}
            />
          </Group>
        </MediaQuery>
      </Stack>
      <Space h="xl" />
      <Title order={3}>Character Traits</Title>
      <Text fz="sm">Type something in one of the fields and click add</Text>
      <MediaQuery
        smallerThan="lg"
        styles={{
          flexDirection: "column",
          ".mantine-MultiSelect-root": {
            maxWidth: "unset",
            width: "100%",
          },
        }}
      >
        <Stack mt="md">
          <MultiSelect
            data={personalitiesData}
            creatable
            searchable
            label="Personalities"
            placeholder="Personalities"
            getCreateLabel={(query) => `+ Add ${query}`}
            onCreate={(query) => {
              const item = { value: query, label: query };
              setPersonalitiesData((current) => [...current, item]);
              return item;
            }}
            disabled={form.values.previewOnly}
            maxSelectedValues={10}
            description="Up to 10 items"
            {...form.getInputProps("personalities")}
          />
          <MultiSelect
            data={responseStylesData}
            creatable
            searchable
            label="Response Styles"
            placeholder="Type something in"
            getCreateLabel={(query) => `+ Add ${query}`}
            onCreate={(query) => {
              const item = { value: query, label: query };
              setResponseStylesData((current) => [...current, item]);
              return item;
            }}
            disabled={form.values.previewOnly}
            maxSelectedValues={10}
            description="Up to 10 items"
            {...form.getInputProps("response_styles")}
          />
          <MultiSelect
            data={favoriteWordsData}
            creatable
            searchable
            label="Favorite words/phrases"
            placeholder="Type something in"
            getCreateLabel={(query) => `+ Add ${query}`}
            onCreate={(query) => {
              const item = { value: query, label: query };
              setFavoriteWordsData((current) => [...current, item]);
              return item;
            }}
            disabled={form.values.previewOnly}
            maxSelectedValues={20}
            description="Up to 20 items"
            {...form.getInputProps("favorite_words")}
          />
        </Stack>
      </MediaQuery>
      <Space h="xl" />
      <Title order={3}>Visibility</Title>
      <Group mt="md">
        <Switch
          label="Private"
          disabled={form.values.previewOnly}
          {...form.getInputProps("private", { type: "checkbox" })}
        />
        <Switch
          label="Shown definition to the public"
          disabled={form.values.previewOnly}
          {...form.getInputProps("definition_visibility", { type: "checkbox" })}
        />
        <Switch
          color="yellow"
          label="NSFW"
          disabled={form.values.previewOnly}
          {...form.getInputProps("nsfw", { type: "checkbox" })}
        />
      </Group>
    </Box>
  );
};

export default BasicTab;
