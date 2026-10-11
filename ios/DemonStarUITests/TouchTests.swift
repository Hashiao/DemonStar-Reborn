import XCTest

// 真正的系统长按，不能用 DOM dispatchEvent 替代。 / Real system long presses, never DOM dispatchEvent substitutes.
final class TouchTests: XCTestCase {
    func testLongPressAndMenuModes() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["--touch-probe", "-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        func state() -> [String: Any] {
            let text = app.staticTexts["touch-probe"].label
            return (try? JSONSerialization.jsonObject(with: Data(text.utf8))) as? [String: Any] ?? [:]
        }
        func wait(_ check: () -> Bool) {
            let end = Date().addingTimeInterval(25)
            while !check() && Date() < end { Thread.sleep(forTimeInterval: 0.1) }
            XCTAssertTrue(check(), "Native touch condition timed out: \(state())")
        }
        func tap(_ prefix: String) {
            // 原生首选语言不能覆盖保存的手动选择；接受三语的真实菜单。
            // Native preferences must not override saved language choices; accept the actual trilingual menu.
            let labels = ["Multiplayer": ["Multiplayer", "多人游戏", "多人遊戲"], "Two players · same device": ["Two players · same device", "同屏双人", "同屏雙人"], "Single player": ["Single player", "单人游戏", "單人遊戲"]][prefix] ?? (prefix == "Start from stage 1" ? ["Start from stage 1", "从头开始", "從頭開始"] : ["Launch", "开始游戏", "開始遊戲"])
            let button = app.webViews.buttons.matching(NSPredicate(format: "label BEGINSWITH %@ OR label BEGINSWITH %@ OR label BEGINSWITH %@", labels[0], labels[1], labels[2])).firstMatch
            XCTAssertTrue(button.waitForExistence(timeout: 20), prefix); button.tap()
        }
        for count in [2, 1] {
            app.launch(); XCTAssertTrue(app.staticTexts["touch-probe"].waitForExistence(timeout: 25))
            wait { state()["phase"] as? String == "menu" }
            if count == 2 { tap("Multiplayer"); tap("Two players · same device") } else { tap("Single player") }
            tap("Launch")
            wait { state()["phase"] as? String == "playing" }
            XCTAssertEqual((state()["players"] as? [[String: Any]])?.count, count)
            for index in 0..<count {
                let suffix = index == 0 ? "" : "-2"
                let before = (state()["players"] as! [[String: Any]])[index]["x"] as! Double
                for key in ["fire", "bomb", "joystick"] {
                    let id = key + suffix, rect = (state()["rects"] as! [String: [String: Double]])[id]!
                    let point = app.webViews.firstMatch.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: rect["x"]! + rect["w"]! * 0.5, dy: rect["y"]! + rect["h"]! * 0.5))
                    if key == "joystick" {
                        point.press(forDuration: 1.6, thenDragTo: point.withOffset(CGVector(dx: 38, dy: 0)))
                    } else { point.press(forDuration: 1.6) }
                    if key == "fire" {
                        wait { ((state()["players"] as? [[String: Any]])?[index]["latched"] as? Bool) == true }
                        let shots = (state()["players"] as! [[String: Any]])[index]["shots"] as! Int
                        wait { ((state()["players"] as? [[String: Any]])?[index]["shots"] as? Int ?? 0) > shots }
                        point.tap()
                        wait { ((state()["players"] as? [[String: Any]])?[index]["latched"] as? Bool) == false }
                    }
                    wait { ((state()["holds"] as? [String: Double])?[id] ?? 0) >= 1.3 }
                    XCTAssertEqual(state()["selected"] as? Bool, false)
                    XCTAssertFalse(app.menuItems["Copy"].exists)
                }
                let player = (state()["players"] as! [[String: Any]])[index]
                XCTAssertGreaterThan(player["x"] as! Double, before)
                XCTAssertGreaterThan(player["shots"] as! Int, 8)
                XCTAssertEqual(player["bombs"] as! Int, 2)
                XCTAssertEqual(player["fireMode"] as? String, "toggle")
                XCTAssertEqual(player["touch"] as? String, "floating")
            }
            XCTAssertEqual(state()["guard"] as? String, "none")
            let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.lifetime = .keepAlways; add(screenshot)
            app.terminate()
        }
    }
}
