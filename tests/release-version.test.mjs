import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json')),gradle=read('android/app/build.gradle.kts'),plist=read('ios/DemonStar/Info.plist'),project=read('ios/DemonStar.xcodeproj/project.pbxproj'),generator=read('tools/generate-ios-project.py');
const plistString=key=>plist.match(new RegExp('<key>'+key+'</key>\\s*<string>([^<]+)</string>'))?.[1];
test('release version agrees across package, Android, iOS plist, checked-in Xcode project and generator',()=>{
 assert.equal(gradle.match(/versionName\s*=\s*"([^"]+)"/)[1],pkg.version);
 assert.equal(plistString('CFBundleShortVersionString'),pkg.version);
 for(const text of [project,generator]){const versions=[...text.matchAll(/MARKETING_VERSION\s*=\s*([^;]+);/g)];assert.ok(versions.length);for(const v of versions)assert.equal(v[1],pkg.version);}
});
test('release build number agrees in Android and every iOS configuration and generated project',()=>{
 const build=gradle.match(/versionCode\s*=\s*(\d+)/)[1];assert.equal(plistString('CFBundleVersion'),build);
 for(const text of [project,generator]){const builds=[...text.matchAll(/CURRENT_PROJECT_VERSION\s*=\s*(\d+)/g)];assert.ok(builds.length);for(const b of builds)assert.equal(b[1],build);}
});
