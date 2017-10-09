package sourcegear.graph

import Fixture.{AkkaTestFixture, TestBase}
import Fixture.compilerUtils.GearUtils
import better.files.File
import com.opticdev.core.sourcegear.SourceGear
import com.opticdev.core.sourcegear.graph.ProjectGraphWrapper
import com.opticdev.core.sourcegear.graph.enums.AstPropertyRelationship
import com.opticdev.core.sourcegear.graph.model.{LinkedModelNode, Path}
import com.opticdev.core.sourcegear.mutate.MutationSteps._
import com.opticdev.core.sourcegear.project.Project
import com.opticdev.parsers.SourceParserManager
import com.opticdev.parsers.ParserBase
import org.scalatest.FunSpec
import play.api.libs.json.{JsObject, JsString}

import scalax.collection.mutable.Graph

class ModelNodeTest extends AkkaTestFixture("ModelNodeTest") with GearUtils {

  describe("Model node test") {

    val sourceGear = new SourceGear {
      override val parsers: Set[ParserBase] = SourceParserManager.installedParsers
    }

    val testFilePath = getCurrentDirectory + "/src/test/resources/example_source/ImportSource.js"

    val projectGraphWrapper = new ProjectGraphWrapper(Graph())
    implicit val project = new Project("test", File(getCurrentDirectory + "/src/test/resources/example_source/"), sourceGear) {
      override def projectGraph = projectGraphWrapper.projectGraph
    }

    val importResults = {
      val importGear = gearFromDescription("src/test/resources/sdkDescriptions/ImportExample.json")
      sourceGear.gearSet.addGear(importGear)
      sourceGear.parseFile(File(testFilePath))
    }

    projectGraphWrapper.addFile(importResults.get.astGraph, File(testFilePath))

    it("can resolve when flat") {

      val helloWorldImport = importResults.get.modelNodes.find(i=> (i.value \ "pathTo").get == JsString("world")).get
      val resolved = helloWorldImport.resolve
      val resolvedMapping = resolved.mapping

      assert(resolvedMapping.size == 2)
      assert(resolvedMapping.get(Path("definedAs")).get.relationship == AstPropertyRelationship.Token)
      assert(resolvedMapping.get(Path("pathTo")).get.relationship == AstPropertyRelationship.Literal)

    }

    describe("Mutation") {

      val helloWorldImport = importResults.get.modelNodes.find(i=> (i.value \ "pathTo").get == JsString("world")).get

      it("Can mutate a token") {
        val resolved = helloWorldImport.resolve
        import com.opticdev.core.sourcegear.mutate.MutationImplicits._
        implicit val fileContents = File(testFilePath).contentAsString
        val result = resolved.update(JsObject(Seq("definedAs" -> JsString("goodbye"), "pathTo" -> JsString("local"))))
        assert(result.toString == "let goodbye = require('local')\n\nfunction test () {\n    let nextOne = require(\"PIZZA!\")\n}")
      }

    }

  }

}
