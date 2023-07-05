import { Anchor, Code, Divider, MediaQuery, ScrollArea, Table, Text, Title } from "@mantine/core";
import { Prism } from "@mantine/prism";
import { FC } from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";

const lineHeight = 2.2;

const MessageMarkdownRenderer: FC<{ children: string }> = (props) => {
  return (
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => (
          <MediaQuery
            smallerThan="sm"
            styles={(theme) => ({
              fontSize: theme.fontSizes.sm,
            })}
          >
            <Text
              sx={{
                color: "white",
              }}
              size="md"
              {...props}
            />
          </MediaQuery>
        ),
        a: ({ node, ...props }) => <Anchor {...props} />,
        h1: ({ node, ...props }) => (
          <Title
            sx={{
              lineHeight: lineHeight,
            }}
            color="white"
            order={1}
            {...props}
          />
        ),
        h2: ({ node, ...props }) => (
          <Title
            sx={{
              lineHeight: lineHeight,
            }}
            color="white"
            order={2}
            {...props}
          />
        ),
        h3: ({ node, ...props }) => (
          <Title
            sx={{
              lineHeight: lineHeight,
            }}
            color="white"
            order={3}
            {...props}
          />
        ),
        h4: ({ node, ...props }) => (
          <Title
            sx={{
              lineHeight: lineHeight,
            }}
            color="white"
            order={4}
            {...props}
          />
        ),
        h5: ({ node, ...props }) => (
          <Title
            sx={{
              lineHeight: lineHeight,
            }}
            color="white"
            order={5}
            {...props}
          />
        ),
        h6: ({ node, ...props }) => (
          <Title
            sx={{
              lineHeight: lineHeight,
            }}
            color="white"
            order={6}
            {...props}
          />
        ),
        hr: ({ node, ...props }) => <Divider my="xs" />,
        table: ({ children }) => (
          <MediaQuery
            smallerThan="xs"
            styles={{
              maxWidth: "300px",
            }}
          >
            <ScrollArea
              sx={{
                maxWidth: "700px",
                overflowX: "auto",
              }}
            >
              <Table striped highlightOnHover withBorder withColumnBorders my="sm">
                {children}
              </Table>
            </ScrollArea>
          </MediaQuery>
        ),
        code({ node, inline, className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <MediaQuery
              smallerThan={420}
              styles={{
                maxWidth: "300px",
              }}
            >
              <MediaQuery
                smallerThan="xs"
                styles={{
                  maxWidth: "400px",
                }}
              >
                <Prism
                  // @ts-expect-error
                  language={match[1]}
                  sx={{
                    overflowX: "auto",
                  }}
                  my="lg"
                >
                  {String(children)}
                </Prism>
              </MediaQuery>
            </MediaQuery>
          ) : (
            <Code>{children}</Code>
          );
        },
        pre: ({ children }) => <>{children}</>,
      }}
      remarkPlugins={[remarkGfm]}
    >
      {props.children}
    </ReactMarkdown>
  );
};

export default MessageMarkdownRenderer;
