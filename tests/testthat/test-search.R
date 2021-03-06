context("search")

library(shiny)
library(RSelenium)
library(testthat)

remDr       <- remoteDriver(port = 4444)
remDr$open(silent = TRUE)
sysDetails  <- remDr$getStatus()
browser     <- remDr$sessionInfo$browserName
appURL      <- "http://127.0.0.1:8888"

test_that("entering search terms returns 10 questions per page", {
  remDr$setImplicitWaitTimeout(10000)
  remDr$navigate(appURL)
  remDr$executeScript(
    "question = $('#question');question.val('Prison officers');Shiny.onInputChange('question', 'Prison officers')"
  )
  Sys.sleep(5)
  oddResultsRows  <- length(remDr$findElements("css selector", "#similarity_table .odd"))
  evenResultsRows <- length(remDr$findElements("css selector", "#similarity_table .even"))
  totalRowCount   <- oddResultsRows + evenResultsRows
  expect_equal(oddResultsRows, 5)
  expect_equal(evenResultsRows, 5)
  expect_equal(totalRowCount, 10)
})

remDr$close()
