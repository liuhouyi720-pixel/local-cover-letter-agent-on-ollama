param(
  [Parameter(Mandatory = $true)][string]$TemplatePath,
  [Parameter(Mandatory = $true)][string]$OutputDocxPath,
  [Parameter(Mandatory = $true)][string]$OutputPdfPath,
  [Parameter(Mandatory = $true)][string]$PayloadJsonPath
)

$ErrorActionPreference = "Stop"

function Get-SafeString {
  param([object]$Value)
  if ($null -eq $Value) { return "" }
  return ([string]$Value).Trim()
}

function Join-WithLineBreak {
  param([string[]]$Lines)
  $safe = @()
  foreach ($line in $Lines) {
    $value = Get-SafeString $line
    if ($value) { $safe += $value }
  }
  if ($safe.Count -eq 0) { return "" }
  return ($safe -join [char]11)
}

function Set-ParagraphText {
  param(
    [object]$Doc,
    [int]$Index,
    [string]$Text
  )

  if ($Doc.Paragraphs.Count -lt $Index) { return }
  $range = $Doc.Paragraphs.Item($Index).Range
  $range.Text = (Get-SafeString $Text) + "`r"
}

function Replace-Token {
  param(
    [object]$Range,
    [string]$Token,
    [string]$Value
  )

  $find = $Range.Find
  $find.ClearFormatting()
  $find.Replacement.ClearFormatting()
  $find.Text = $Token
  $find.Replacement.Text = $Value.Replace("`r`n", [char]11).Replace("`n", [char]11)
  [void]$find.Execute(
    $Token,
    $false, $false, $false, $false, $false,
    $true, 1, $false,
    $find.Replacement.Text,
    2
  )
}

$payload = Get-Content -Path $PayloadJsonPath -Raw | ConvertFrom-Json

$senderName = Get-SafeString $payload.sender_name
$senderContact = Get-SafeString $payload.sender_contact_line
$senderLocation = Get-SafeString $payload.sender_location_line
$dateLine = Get-SafeString $payload.date_line
$recipientName = Get-SafeString $payload.recipient_name
$recipientCompany = Get-SafeString $payload.recipient_company
$recipientAddressLines = @()
if ($payload.recipient_address_lines) {
  foreach ($line in $payload.recipient_address_lines) {
    $value = Get-SafeString $line
    if ($value) { $recipientAddressLines += $value }
  }
}
$salutation = Get-SafeString $payload.salutation
$bodyParagraphs = @()
if ($payload.body_paragraphs) {
  foreach ($line in $payload.body_paragraphs) {
    $value = Get-SafeString $line
    if ($value) { $bodyParagraphs += $value }
  }
}
while ($bodyParagraphs.Count -lt 5) { $bodyParagraphs += "" }
if ($bodyParagraphs.Count -gt 5) { $bodyParagraphs = $bodyParagraphs[0..4] }
$closingLine = Get-SafeString $payload.closing_line
$signatureName = Get-SafeString $payload.signature_name

$senderBlock = Join-WithLineBreak @($senderName, $senderContact, $senderLocation)
$recipientCombined = @($recipientName, $recipientCompany)
if ($recipientAddressLines.Count -gt 0) {
  $recipientCombined += $recipientAddressLines
}
$recipientBlock = Join-WithLineBreak $recipientCombined
$closingBlock = Join-WithLineBreak @($closingLine, $signatureName)

$word = $null
$doc = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  $doc = $word.Documents.Open($TemplatePath, $false, $false)
  $contentText = [string]$doc.Content.Text
  $hasTemplateTokens = $contentText.Contains("{{SENDER_NAME}}")

  if ($hasTemplateTokens) {
    $fullRange = $doc.Content
    Replace-Token $fullRange "{{SENDER_NAME}}" $senderName
    Replace-Token $fullRange "{{SENDER_CONTACT_LINE}}" $senderContact
    Replace-Token $fullRange "{{SENDER_LOCATION_LINE}}" $senderLocation
    Replace-Token $fullRange "{{DATE_LINE}}" $dateLine
    Replace-Token $fullRange "{{RECIPIENT_NAME}}" $recipientName
    Replace-Token $fullRange "{{RECIPIENT_COMPANY}}" $recipientCompany
    Replace-Token $fullRange "{{RECIPIENT_ADDRESS_LINES}}" (Join-WithLineBreak $recipientAddressLines)
    Replace-Token $fullRange "{{SALUTATION}}" $salutation
    Replace-Token $fullRange "{{BODY_P1}}" $bodyParagraphs[0]
    Replace-Token $fullRange "{{BODY_P2}}" $bodyParagraphs[1]
    Replace-Token $fullRange "{{BODY_P3}}" $bodyParagraphs[2]
    Replace-Token $fullRange "{{BODY_P4}}" $bodyParagraphs[3]
    Replace-Token $fullRange "{{BODY_P5}}" $bodyParagraphs[4]
    Replace-Token $fullRange "{{CLOSING_LINE}}" $closingLine
    Replace-Token $fullRange "{{SIGNATURE_NAME}}" $signatureName
  } else {
    # Positional fallback compatible with the default 10-paragraph template.
    Set-ParagraphText $doc 1 $senderBlock
    Set-ParagraphText $doc 2 $dateLine
    Set-ParagraphText $doc 3 $recipientBlock
    Set-ParagraphText $doc 4 $salutation
    Set-ParagraphText $doc 5 $bodyParagraphs[0]
    Set-ParagraphText $doc 6 $bodyParagraphs[1]
    Set-ParagraphText $doc 7 $bodyParagraphs[2]
    Set-ParagraphText $doc 8 $bodyParagraphs[3]
    Set-ParagraphText $doc 9 $bodyParagraphs[4]
    Set-ParagraphText $doc 10 $closingBlock
  }

  $doc.SaveAs2([ref]$OutputDocxPath, [ref]16)
  $doc.ExportAsFixedFormat($OutputPdfPath, 17)
}
finally {
  if ($doc -ne $null) {
    $doc.Close([ref]0)
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
  }
  if ($word -ne $null) {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  }
}
