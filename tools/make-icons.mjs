import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_PATH||'sharp');
const dir='ios/DemonStar/Assets.xcassets/AppIcon.appiconset';await mkdir(dir,{recursive:true});
// 两端由同一重绘像素图机械生成尺寸，不再裁切战机图集或使用矢量替代。
// Mechanically size one redrawn pixel icon for both platforms, replacing atlas crops/vector substitutes.
const icon=await sharp('web/assets/app-icon-pixel-hd.png').resize(1024,1024,{kernel:'nearest'}).flatten({background:'#000000'}).removeAlpha().png().toBuffer();
const specs=[['iphone','20x20',2],['iphone','20x20',3],['iphone','29x29',2],['iphone','29x29',3],['iphone','40x40',2],['iphone','40x40',3],['iphone','60x60',2],['iphone','60x60',3],['ipad','20x20',1],['ipad','20x20',2],['ipad','29x29',1],['ipad','29x29',2],['ipad','40x40',1],['ipad','40x40',2],['ipad','76x76',1],['ipad','76x76',2],['ipad','83.5x83.5',2],['ios-marketing','1024x1024',1]];
const images=[];
for(const [idiom,size,scale] of specs){const pixels=Number(size.split('x')[0])*scale,filename=`icon-${idiom}-${pixels}.png`;await sharp(icon).resize(pixels,pixels,{kernel:'nearest'}).toFile(dir+'/'+filename);images.push({idiom,size,scale:scale+'x',filename});}
await writeFile(dir+'/Contents.json',JSON.stringify({images,info:{author:'xcode',version:1}},null,2));await writeFile('ios/DemonStar/Assets.xcassets/Contents.json',JSON.stringify({info:{author:'xcode',version:1}}));
const android='android/app/src/main/res';
for(const [density,pixels] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){const folder=android+'/mipmap-'+density;await mkdir(folder,{recursive:true});await sharp(icon).resize(pixels,pixels,{kernel:'nearest'}).toFile(folder+'/ic_launcher.png');}
await mkdir(android+'/drawable-nodpi',{recursive:true});await writeFile(android+'/drawable-nodpi/ic_launcher_pixel.png',icon);
await mkdir(android+'/mipmap-anydpi-v26',{recursive:true});await writeFile(android+'/mipmap-anydpi-v26/ic_launcher.xml','<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@android:color/black"/><foreground><inset android:drawable="@drawable/ic_launcher_pixel" android:inset="16.67%"/></foreground></adaptive-icon>\n');
console.log('已统一打包 Android/iOS 像素图标 / Packaged shared Android/iOS pixel icons.');
