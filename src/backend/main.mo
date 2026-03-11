import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // Types
  public type UserProfile = {
    id : Text;
    name : Text;
    favoriteGenres : [Genre];
    bio : Text;
  };

  module UserProfile {
    public func compareById(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  public type Genre = {
    #pop;
    #rock;
    #jazz;
    #classical;
    #hipHop;
    #electronic;
    #country;
    #reggae;
    #metal;
    #folk;
    #blues;
    #rnb;
    #soul;
    #latin;
    #dance;
    #punk;
  };

  public type Song = {
    id : Text;
    title : Text;
    artist : Text;
    album : Text;
    genres : [Genre];
    file : ?Storage.ExternalBlob;
    coverArt : ?Storage.ExternalBlob;
    lyrics : Text;
  };

  module Song {
    public func compareById(a : Song, b : Song) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  public type Playlist = {
    id : Text;
    title : Text;
    owner : Principal;
    songIds : [Text];
    sharedWith : [Principal];
  };

  module Playlist {
    public func compareById(a : Playlist, b : Playlist) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  public type ChatMessage = {
    id : Text;
    sender : Principal;
    content : Text;
    timestamp : Int;
  };

  public type SharedFile = {
    id : Text;
    sender : Principal;
    receiver : ?Principal;
    file : Storage.ExternalBlob;
    message : Text;
    timestamp : Int;
  };

  public type ListeningHistory = {
    user : Principal;
    song : Text;
    timestamp : Int;
  };

  public type Review = {
    id : Text;
    user : Principal;
    song : Text;
    rating : Nat;
    comment : Text;
    timestamp : Int;
  };

  // Persistence
  let userProfiles = Map.empty<Principal, UserProfile>();
  let songs = Map.empty<Text, Song>();
  let playlists = Map.empty<Text, Playlist>();
  let chatMessages = Map.empty<Text, ChatMessage>();
  let sharedFiles = Map.empty<Text, SharedFile>();
  let listeningHistory = Map.empty<Principal, [ListeningHistory]>();
  let reviews = Map.empty<Text, Review>();

  // Authorization System
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Public functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addSong(song : Song) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add songs");
    };
    songs.add(song.id, song);
  };

  public query ({ caller }) func getSong(id : Text) : async ?Song {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get songs");
    };
    songs.get(id);
  };

  public shared ({ caller }) func createPlaylist(playlist : Playlist) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create playlists");
    };
    playlists.add(playlist.id, playlist);
  };

  public query ({ caller }) func getPlaylist(id : Text) : async ?Playlist {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get playlists");
    };
    playlists.get(id);
  };

  public shared ({ caller }) func addChatMessage(message : ChatMessage) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can chat");
    };
    chatMessages.add(message.id, message);
  };

  public query ({ caller }) func getChatMessages() : async [ChatMessage] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get chat messages");
    };
    chatMessages.values().toArray();
  };

  public shared ({ caller }) func shareFile(sharedFile : SharedFile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can share files");
    };
    sharedFiles.add(sharedFile.id, sharedFile);
  };

  public query ({ caller }) func getSharedFiles() : async [SharedFile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get shared files");
    };
    sharedFiles.values().toArray();
  };

  public shared ({ caller }) func addListeningHistory(history : ListeningHistory) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can listen to songs");
    };
    let existing = switch (listeningHistory.get(history.user)) {
      case (?history) { history };
      case (null) { [] };
    };
    let newHistory = existing.concat([history]);
    listeningHistory.add(history.user, newHistory);
  };

  public query ({ caller }) func getListeningHistory(user : Principal) : async [ListeningHistory] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own listening history");
    };
    switch (listeningHistory.get(user)) {
      case (?history) { history };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func addReview(review : Review) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add reviews");
    };
    reviews.add(review.id, review);
  };

  public query ({ caller }) func getReviews() : async [Review] {
    reviews.values().toArray();
  };

  public query ({ caller }) func getSongsByGenre(genre : Genre) : async [Song] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get songs");
    };
    let filtered = songs.values().toArray().filter(
      func(song) {
        song.genres.find(func(g) { g == genre }) != null;
      }
    );
    filtered;
  };

  public query ({ caller }) func getPlaylistsContainingSong(songId : Text) : async [Playlist] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get playlists");
    };
    let filtered = playlists.values().toArray().filter(
      func(playlist) {
        playlist.songIds.find(func(id) { id == songId }) != null;
      }
    );
    filtered;
  };
};
