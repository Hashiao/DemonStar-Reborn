import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_PATH||'sharp');
const dir='ios/DemonStar/Assets.xcassets/AppIcon.appiconset';await mkdir(dir,{recursive:true});
const meta=await sharp('web/assets/ships-hd.png').metadata();
// Mechanical atlas extraction for platform icon packaging; artwork itself is unchanged.
const sprite=await sharp('web/assets/ships-hd.png').extract({left:0,top:0,width:Math.floor(meta.width/4),height:Math.floor(meta.height/4)}).resize(820,820).toBuffer();
const icon=await sharp({create:{width:1024,height:1024,channels:4,background:'#111720'}}).composite([{input:sprite,left:102,top:102}]).flatten({background:'#111720'}).png().toBuffer();
const specs=[['iphone','20x20',2],['iphone','20x20',3],['iphone','29x29',2],['iphone','29x29',3],['iphone','40x40',2],['iphone','40x40',3],['iphone','60x60',2],['iphone','60x60',3],['ipad','20x20',1],['ipad','20x20',2],['ipad','29x29',1],['ipad','29x29',2],['ipad','40x40',1],['ipad','40x40',2],['ipad','76x76',1],['ipad','76x76',2],['ipad','83.5x83.5',2],['ios-marketing','1024x1024',1]];
const images=[];
for(const [idiom,size,scale] of specs){const pixels=Number(size.split('x')[0])*scale,filename=`icon-${idiom}-${pixels}.png`;await sharp(icon).resize(pixels,pixels).toFile(dir+'/'+filename);images.push({idiom,size,scale:scale+'x',filename});}
await writeFile(dir+'/Contents.json',JSON.stringify({images,info:{author:'xcode',version:1}},null,2));await writeFile('ios/DemonStar/Assets.xcassets/Contents.json',JSON.stringify({info:{author:'xcode',version:1}}));
console.log('Packaged iOS app icons from generated HD atlas.');
