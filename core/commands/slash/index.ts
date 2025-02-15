import GenerateTerminalCommand from "./cmd";
import CommentSlashCommand from "./comment";
import CommitMessageCommand from "./commit";
import DraftIssueCommand from "./draftIssue";
import EditSlashCommand from "./edit";
import HttpSlashCommand from "./http";
import ShareSlashCommand from "./share";
import StackOverflowSlashCommand from "./stackOverflow";
import VerticalEditSlashCommand from "./verticalEdit";

export default [
  DraftIssueCommand,
  ShareSlashCommand,
  StackOverflowSlashCommand,
  GenerateTerminalCommand,
  EditSlashCommand,
  CommentSlashCommand,
  HttpSlashCommand,
  CommitMessageCommand,
  VerticalEditSlashCommand,
];
