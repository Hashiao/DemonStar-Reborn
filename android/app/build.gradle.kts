import java.util.Properties
plugins { id("com.android.application") }
android {
    namespace = "io.github.hashiao.demonstar"
    compileSdk = 37
    buildToolsVersion = "37.0.0"
    defaultConfig {
        applicationId = "io.github.hashiao.demonstar"
        minSdk = 29
        targetSdk = 37
        versionCode = 3
        versionName = "0.2.1"
    }
    val signingFile = rootProject.file("../.local/release-signing.properties")
    if (signingFile.isFile) {
        val p = Properties().apply { signingFile.inputStream().use { load(it) } }
        signingConfigs.create("localRelease") {
            storeFile = rootProject.file(p.getProperty("storeFile"))
            storePassword = p.getProperty("storePassword")
            keyAlias = p.getProperty("keyAlias")
            keyPassword = p.getProperty("keyPassword")
        }
    }
    buildTypes {
        debug { applicationIdSuffix = ".debug"; versionNameSuffix = "-debug" }
        release { isMinifyEnabled = false; isDebuggable = false; if(signingConfigs.findByName("localRelease") != null) signingConfig = signingConfigs.getByName("localRelease") }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    lint { abortOnError = true; checkReleaseBuilds = true }
}
