#### 8/12/23; 4:42:07 PM by DW

Two of my servers are flatlining regularly, boston and peabody. I have no idea what the common denominator is, but the behavior i'm seeing is that some of the apps crash, and don't release their TCP ports, and when <i>forever</i> restarts them, they fail to connect to that port because the OS thinks it's in use by the instance that died. The one with the most relaunches seems to always be batchloader, which calls s3folderload, and that app has almost nothing in it but a call to s3FolderLoader.load. The code inside that routine is complex, and my S3 code is very early, and errors don't seem to be being handled.  So I'm going to put a wrapper around the call to loadFromS3 and do that in a try, so the app at least won't crash there.  

