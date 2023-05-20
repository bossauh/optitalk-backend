import { Col, Container, Row } from "@nextui-org/react";
import { FC, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { Outlet } from "react-router-dom";
import LayoutContext from "../contexts/layout";

// Components
import Box from "../components/Box";
import DarkOverlay from "../components/DarkOverlay/DarkOverlay";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";

const Index: FC = () => {
  const [sideBarActive, setSideBarActive] = useState(false);

  const { width: sideBarWidth, ref: sideBarRef } = useResizeDetector();
  const { height: topBarHeight, ref: topBarRef } = useResizeDetector();

  return (
    <LayoutContext.Provider value={{ sideBarWidth: sideBarWidth, topBarHeight: topBarHeight }}>
      <Container responsive={false} fluid css={{ padding: 0, border: "0px solid red" }}>
        {/* Dark overlay for the sidebar */}
        <DarkOverlay active={sideBarActive} setActive={setSideBarActive} />

        <Row>
          <Col
            css={{
              width: "290px",
              "@smMax": {
                width: "0px",
              },
            }}
          >
            <Box ref={sideBarRef}>
              <SideBar active={sideBarActive} />
            </Box>
          </Col>
          <Col
            css={{
              height: "100vh",
              overflowY: "auto",
            }}
          >
            <Box ref={topBarRef}>
              <TopBar setSideBarActive={setSideBarActive} />
            </Box>
            <Outlet />
          </Col>
        </Row>
      </Container>
    </LayoutContext.Provider>
  );
};

export default Index;
