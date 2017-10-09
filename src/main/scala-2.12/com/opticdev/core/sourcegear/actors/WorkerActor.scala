package com.opticdev.core.sourcegear.actors

import akka.actor.{Actor, Props}
import better.files.File
import com.opticdev.core.sourcegear.graph.{FileNode, ProjectGraphWrapper}
import com.opticdev.core.sourcegear.{FileParseResults, SGContext, SourceGear}
import com.opticdev.parsers.AstGraph

import scala.util.Try

class WorkerActor()(implicit actorCluster: ActorCluster) extends Actor {
  override def receive: Receive = {

    case parseRequest : ParseFile => {
      implicit val project = parseRequest.project
      val requestingActor = parseRequest.requestingActor
      val result: Try[FileParseResults] = parseRequest.sourceGear.parseFile(parseRequest.file)
      if (result.isSuccess) {
        actorCluster.parserSupervisorRef ! AddToCache(FileNode.fromFile(parseRequest.file), result.get.astGraph, result.get.parser, result.get.fileContents)
        sender() tell(ParseSuccessful(result.get, parseRequest.file), requestingActor)
      } else {
        sender() tell(ParseFailed(parseRequest.file), requestingActor)
      }
    }

    case ctxRequest: GetContext => {
      implicit val project = ctxRequest.project
      val file = ctxRequest.fileNode.toFile
      val result: Try[FileParseResults] = ctxRequest.sourceGear.parseFile(file)
      if (result.isSuccess) {
        actorCluster.parserSupervisorRef ! AddToCache(FileNode.fromFile(file), result.get.astGraph, result.get.parser, result.get.fileContents)
        sender() ! Option(SGContext(
          ctxRequest.sourceGear.fileAccumulator,
          result.get.astGraph,
          result.get.parser,
          result.get.fileContents))
        ctxRequest.project.projectActor ! ParseSuccessful(result.get, file)
      } else {
        ctxRequest.project.projectActor ! ParseFailed(file)
        sender() ! None
      }

    }

  }
}

object WorkerActor {
  def props()(implicit actorCluster: ActorCluster) = Props(new WorkerActor)
}