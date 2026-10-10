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
            let button = app.webViews.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
            XCTAssertTrue(button.waitForExistence(timeout: 20), prefix); button.tap()
        }
        for count in [2, 1] {
            app.launch(); XCTAssertTrue(app.staticTexts["touch-probe"].waitForExistence(timeout: 25))
            wait { state()["phase"] as? String == "menu" }
            if count == 2 { tap("Multiplayer"); tap("Two players · same device") } else { tap("Single player") }
            wait { state()["phase"] as? String == "playing" }
            XCTAssertEqual((state()["players"] as? [[String: Any]])?.count, count)
            for index in 0..<count {
                let suffix = index == 0 ? "" : "-2"
                let before = (state()["players"] as! [[String: Any]])[index]["x"] as! Double
                for key in ["fire", "bomb", "joystick"] {
                    let id = key + suffix, rect = (state()["rects"] as! [String: [String: Double]])[id]!
                    app.webViews.firstMatch.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: rect["x"]! + rect["w"]! * (key == "joystick" ? 0.8 : 0.5), dy: rect["y"]! + rect["h"]! * 0.5)).press(forDuration: 1.6)
                    wait { ((state()["holds"] as? [String: Double])?[id] ?? 0) >= 1.3 }
                    XCTAssertEqual(state()["selected"] as? Bool, false)
                    XCTAssertFalse(app.menuItems["Copy"].exists)
                }
                let player = (state()["players"] as! [[String: Any]])[index]
                XCTAssertGreaterThan(player["x"] as! Double, before)
                XCTAssertGreaterThan(player["shots"] as! Int, 8)
                XCTAssertEqual(player["bombs"] as! Int, 2)
            }
            XCTAssertEqual(state()["guard"] as? String, "none")
            let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.lifetime = .keepAlways; add(screenshot)
            app.terminate()
        }
    }
}
