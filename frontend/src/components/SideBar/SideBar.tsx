import { Button, Card, Loading, Text } from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useBottomScrollListener } from "react-bottom-scroll-listener";
import { useNavigate } from "react-router-dom";
import { SessionType, SideBarProps } from "../../common/types";
import { deserializeSessionData } from "../../common/utils";
import StoreContext from "../../contexts/store";

// Components
import Box from "../Box";
import Session from "./Session";
import SideBarFooter from "./SideBarFooter";

// Icons
import { AiOutlinePlus } from "react-icons/ai";

const SideBar: FC<SideBarProps> = (props) => {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [endPage, setEndPage] = useState(false);
  const [page, setPage] = useState(1);

  const store = useContext(StoreContext);

  const navigate = useNavigate();

  const scrollToBottomCallback = () => {
    if (!isLoading && !endPage) {
      setPage((prev) => prev + 1);
    }
  };
  const sessionsRef = useBottomScrollListener(scrollToBottomCallback, {
    offset: 20,
  });

  useEffect(() => {
    if (store?.activeSession?.new) {
      setSessions((prev) => {
        return [store.activeSession as SessionType, ...prev];
      });
    }
  }, [store?.activeSession]);

  useEffect(() => {
    setPage(1);
    setEndPage(false);
    setSessions([]);
  }, [store?.activeCharacter]);

  useEffect(() => {
    setIsLoading(true);
    if (store?.activeCharacter) {
      fetch(`/api/chat/sessions?page_size=20&page=${page}&character_id=` + store.activeCharacter.id)
        .then((r) => r.json())
        .then((data) => {
          const deserialized: SessionType[] = data.payload.data.map((item: any) => {
            return deserializeSessionData(item);
          });

          setSessions((prev) => {
            return prev ? [...prev, ...deserialized] : deserialized;
          });
          setIsLoading(false);

          if (deserialized.length === 0 || deserialized.length < 20) {
            setEndPage(true);
          }
        });
    }
  }, [store?.activeCharacter, page]);

  return (
    <Card
      css={{
        borderRadius: 0,
        height: "100vh",
        transition: "left 0.2s",
        transitionTimingFunction: "ease-out",
        width: "300px",
        "@smMax": {
          position: "absolute",
          width: "250px",
          left: props.active ? 0 : -250,
        },
        background: "$primaryContainerBackground",
        zIndex: 202,
      }}
    >
      <Card.Header
        css={{
          flexDirection: "column",
          alignItems: "start",
          gap: "10px",
          px: "20px",
        }}
      >
        <Box
          css={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Text h3>Sessions</Text>
          <div>
            <Button
              css={{
                mw: "40px",
                minWidth: "40px",
              }}
              iconRight={<AiOutlinePlus />}
              size="sm"
              onPress={() => {
                store?.setActiveSession(undefined);
                navigate("/");
              }}
            />
          </div>
        </Box>
        <Button
          css={{
            display: "block",
            "@sm": {
              display: "none",
            },
          }}
          onPress={() => {
            navigate("/create-character");
          }}
          icon={<AiOutlinePlus />}
        >
          Create Character
        </Button>
      </Card.Header>
      <Card.Divider />
      <Card.Body
        css={{
          px: 0,
          py: 0,
          overflowY: "auto",
          maxHeight: "calc(100vh - 200px)",
        }}
        // @ts-expect-error
        ref={sessionsRef}
      >
        {sessions.map((i) => {
          return <Session {...i} key={i.id} />;
        })}
        {isLoading && store?.activeCharacter && (
          <Loading
            css={{
              mt: sessions.length === 0 ? "40px" : 0,
            }}
          />
        )}
      </Card.Body>

      <Card.Divider />
      <SideBarFooter />
    </Card>
  );
};

export default SideBar;
