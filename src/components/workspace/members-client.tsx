"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2, UserPlus, Trash2, Crown, User } from "lucide-react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { inviteMemberSchema, InviteMemberInput } from "@/lib/validations/member";
import { getInitials, formatRelativeTime } from "@/lib/utils/format";

interface Member {
  id: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MembersClientProps {
  workspaceId: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}

export default function MembersClient({
  workspaceId,
  members: initialMembers,
  currentUserId,
  isOwner,
}: MembersClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  const onInvite = async (data: InviteMemberInput) => {
    setIsInviting(true);
    try {
      const response = await axios.post(
        `/api/workspaces/${workspaceId}/members`,
        data
      );
      toast.success("Member invited successfully");
      reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const onRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      await axios.delete(
        `/api/workspaces/${workspaceId}/members/${memberId}`
      );
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Invite member */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>
              Invite someone to collaborate in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onInvite)} className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="colleague@example.com"
                  {...register("email")}
                  disabled={isInviting}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span className="ml-2">Invite</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.user.image ?? ""} />
                  <AvatarFallback>
                    {getInitials(member.user.name ?? member.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.user.name ?? "Unknown"}
                    {member.user.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role badge */}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {member.role === "OWNER" ? (
                    <Crown className="h-3 w-3 text-amber-500" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {member.role === "OWNER" ? "Owner" : "Member"}
                </span>

                {/* Remove button */}
                {isOwner && member.user.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(member.id)}
                    disabled={removingId === member.id}
                  >
                    {removingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}