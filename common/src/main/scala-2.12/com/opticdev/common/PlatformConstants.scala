package com.opticdev.common

import better.files.File
import com.opticdev.common.storage.{Linux, Mac, OS, Windows}
import org.apache.commons.lang3.SystemUtils
import scala.util.Try
import sys.process._

object PlatformConstants {
  //@todo figure out a nice way to make this work on other platforms
  val platform : OS = {
    if (SystemUtils.IS_OS_MAC_OSX) {
      Mac
    } else if (SystemUtils.IS_OS_WINDOWS) {
      Windows
    } else if (SystemUtils.IS_OS_LINUX) {
      Linux
    } else {
      throw new Error("Unsupported Platform. Optic requires a Windows, Mac or Linux environment")
    }
  }

  val dataDirectory : File = platform match {
    case Mac => File(SystemUtils.USER_HOME+"/Library/Application Support/Optic")
      .createIfNotExists(asDirectory = true, createParents = false)
    case Linux => File(SystemUtils.USER_HOME+"/optic")
      .createIfNotExists(asDirectory = true, createParents = false)
    case Windows => File(SystemUtils.USER_HOME+"/optic")
      .createIfNotExists(asDirectory = true, createParents = false)
  }

}